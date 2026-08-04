import { byUpdatedDesc } from "@/lib/sort";
import type { KnowledgeObject, Room } from "@/lib/types";

/** A `[start, end)` slice of a display string that the query matched. */
export interface MatchRange {
  start: number;
  end: number;
}

export interface ObjectSearchResult {
  kind: "object";
  object: KnowledgeObject;
  roomName: string | null;
  score: number;
  /** Ranges within `object.title`, for highlighting. Empty for fuzzy hits. */
  matches: MatchRange[];
}

export interface RoomSearchResult {
  kind: "room";
  room: Room;
  score: number;
  /** Ranges within `room.name`, for highlighting. */
  matches: MatchRange[];
}

export interface SearchResults {
  rooms: RoomSearchResult[];
  objects: ObjectSearchResult[];
}

/**
 * How much each kind of hit is worth, per query token.
 *
 * `titleWordPrefix` is the one that makes multi-word searching feel right:
 * "ferment log" reaches "Fermentation log" because each token starts a word,
 * even though neither is a prefix of the whole title.
 *
 * `subsequence` is deliberately tiny. It exists so a typo or an abbreviation
 * still surfaces something, and it is scored so that a fuzzy hit can never
 * outrank a record that genuinely contains the text.
 */
const TOKEN_SCORE = {
  titleExact: 140,
  titlePrefix: 100,
  titleWordPrefix: 85,
  titleSubstring: 60,
  tagExact: 55,
  tagSubstring: 35,
  content: 15,
  meta: 10,
  subsequence: 6,
} as const;

/** Bonuses for matching the query as one phrase rather than scattered tokens. */
const PHRASE_EXACT = 80;
const PHRASE_SUBSTRING = 40;

/** Splits a query into lowercase tokens, dropping surrounding whitespace. */
export function tokenize(query: string): string[] {
  return query.toLowerCase().split(/\s+/).filter(Boolean);
}

/** Characters that count as the start of a new word. */
const SEPARATOR = /[\s\-_/\\.,:;!?()[\]{}'"“”‘’]/;

/**
 * Index of the first occurrence of `token` that begins a word, or -1.
 *
 * Written as a scan rather than a `\b` regex because `\b` is defined over ASCII
 * word characters, so it misfires on the accented text this app is full of.
 */
function wordStartIndex(text: string, token: string): number {
  let from = 0;
  for (;;) {
    const index = text.indexOf(token, from);
    if (index === -1) return -1;
    if (index === 0 || SEPARATOR.test(text[index - 1])) return index;
    from = index + 1;
  }
}

/** Every non-overlapping occurrence of `token` in `text`. */
function occurrences(text: string, token: string): MatchRange[] {
  const ranges: MatchRange[] = [];
  let from = 0;
  for (;;) {
    const index = text.indexOf(token, from);
    if (index === -1) return ranges;
    ranges.push({ start: index, end: index + token.length });
    from = index + token.length;
  }
}

/**
 * Sorts and coalesces overlapping or touching ranges.
 *
 * Every returned range is a fresh object: the merge step widens `end` in
 * place, which would otherwise reach back into the caller's array.
 */
export function mergeRanges(ranges: MatchRange[]): MatchRange[] {
  const sorted = ranges
    .map((range) => ({ ...range }))
    .sort((a, b) => a.start - b.start);
  if (sorted.length < 2) return sorted;

  const merged: MatchRange[] = [sorted[0]];
  for (const range of sorted.slice(1)) {
    const last = merged[merged.length - 1];
    if (range.start <= last.end) last.end = Math.max(last.end, range.end);
    else merged.push(range);
  }
  return merged;
}

/**
 * Shortest token that may match fuzzily. Below this almost every title is a
 * subsequence of almost every query, and the fallback becomes noise.
 */
const MIN_FUZZY_LENGTH = 3;

/** Whether `token`'s characters appear in `text` in order, with gaps allowed. */
function isSubsequence(text: string, token: string): boolean {
  let cursor = 0;
  for (const char of token) {
    cursor = text.indexOf(char, cursor);
    if (cursor === -1) return false;
    cursor += 1;
  }
  return true;
}

/** Best score for one token against one record, and where it hit the title. */
interface TokenHit {
  score: number;
  titleRanges: MatchRange[];
}

function scoreTokenAgainst(
  token: string,
  title: string,
  extras: {
    tags?: readonly string[];
    content?: string;
    meta?: readonly (string | undefined)[];
  },
): TokenHit {
  let score = 0;

  if (title === token) score += TOKEN_SCORE.titleExact;
  else if (title.startsWith(token)) score += TOKEN_SCORE.titlePrefix;
  else if (wordStartIndex(title, token) !== -1)
    score += TOKEN_SCORE.titleWordPrefix;
  else if (title.includes(token)) score += TOKEN_SCORE.titleSubstring;

  for (const tag of extras.tags ?? []) {
    const lower = tag.toLowerCase();
    if (lower === token) score += TOKEN_SCORE.tagExact;
    else if (lower.includes(token)) score += TOKEN_SCORE.tagSubstring;
  }

  if (extras.content && extras.content.toLowerCase().includes(token)) {
    score += TOKEN_SCORE.content;
  }

  for (const value of extras.meta ?? []) {
    if (value && value.toLowerCase().includes(token)) score += TOKEN_SCORE.meta;
  }

  // Only reached when the token appears nowhere verbatim.
  if (
    score === 0 &&
    token.length >= MIN_FUZZY_LENGTH &&
    isSubsequence(title, token)
  ) {
    return { score: TOKEN_SCORE.subsequence, titleRanges: [] };
  }

  return { score, titleRanges: occurrences(title, token) };
}

/**
 * Scores a record against every token, requiring all of them to hit.
 *
 * The AND is the point: searching "brew log" should narrow, not widen. Any
 * token that matches nothing disqualifies the record entirely.
 */
function scoreRecord(
  tokens: string[],
  phrase: string,
  title: string,
  extras: Parameters<typeof scoreTokenAgainst>[2],
): TokenHit | null {
  let total = 0;
  const ranges: MatchRange[] = [];

  for (const token of tokens) {
    const hit = scoreTokenAgainst(token, title, extras);
    if (hit.score === 0) return null;
    total += hit.score;
    ranges.push(...hit.titleRanges);
  }

  // A record containing the query as written beats one that merely contains
  // the same words in some other order.
  if (tokens.length > 1) {
    if (title === phrase) total += PHRASE_EXACT;
    else if (title.includes(phrase)) total += PHRASE_SUBSTRING;
  }

  return { score: total, titleRanges: mergeRanges(ranges) };
}

/**
 * Scored full-text search across rooms and objects.
 *
 * Title/name matches outrank tag matches, which outrank content matches. Every
 * query token has to match somewhere, and fuzzy (subsequence) hits are ranked
 * below anything containing the text verbatim.
 */
export function searchPalace(
  query: string,
  rooms: Room[],
  objects: KnowledgeObject[],
): SearchResults {
  const phrase = query.trim().toLowerCase().replace(/\s+/g, " ");
  const tokens = tokenize(phrase);
  if (tokens.length === 0) return { rooms: [], objects: [] };

  const roomById = new Map(rooms.map((room) => [room.id, room]));

  const roomResults: RoomSearchResult[] = [];
  for (const room of rooms) {
    const hit = scoreRecord(tokens, phrase, room.name.toLowerCase(), {
      content: room.description,
    });
    if (!hit) continue;
    roomResults.push({
      kind: "room",
      room,
      score: hit.score,
      matches: hit.titleRanges,
    });
  }
  roomResults.sort((a, b) => b.score - a.score);

  const objectResults: ObjectSearchResult[] = [];
  for (const object of objects) {
    const hit = scoreRecord(tokens, phrase, object.title.toLowerCase(), {
      tags: object.tags,
      content: object.content,
      meta: [object.url, object.fileName],
    });
    if (!hit) continue;
    objectResults.push({
      kind: "object",
      object,
      roomName: roomById.get(object.roomId)?.name ?? null,
      score: hit.score,
      matches: hit.titleRanges,
    });
  }
  objectResults.sort(
    (a, b) => b.score - a.score || byUpdatedDesc(a.object, b.object),
  );

  return { rooms: roomResults, objects: objectResults };
}
