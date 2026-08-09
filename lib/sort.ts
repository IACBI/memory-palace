/**
 * Comparators shared by every list in the app.
 *
 * The "most recently updated first" rule was written out by hand in five
 * places, each parsing its own dates. One of them sorting the other way is the
 * kind of bug nobody reports — the list simply looks wrong and people assume
 * they misremembered.
 */

interface Timestamped {
  createdAt: string;
  updatedAt: string;
}

interface Titled {
  title: string;
}

interface Pinnable {
  pinned?: boolean;
}

/**
 * Parsed timestamps, kept between calls.
 *
 * A comparator runs O(n log n) times, twice per comparison, over a set of at
 * most n distinct strings — so parsing inside it did the same few thousand ISO
 * parses over and over. That is most of the cost of typing in the library's
 * search box, which re-sorts the whole list on every keystroke.
 *
 * Cleared wholesale rather than evicted: entries are only ever added for
 * timestamps that exist in the palace, so the map settles at that size, and the
 * bound is there for the pathological case of an import loop rather than for
 * normal use.
 */
const parsed = new Map<string, number>();
const PARSE_CACHE_MAX = 4096;

/**
 * Milliseconds for an ISO timestamp, or `0` if it cannot be parsed.
 *
 * Imported data can carry a malformed date. `NaN` poisons a comparator — the
 * result is neither less than, greater than, nor equal, and the sort order
 * becomes implementation-defined for the whole list, not just that row.
 */
function time(value: string): number {
  const cached = parsed.get(value);
  if (cached !== undefined) return cached;

  const ms = Date.parse(value);
  const safe = Number.isNaN(ms) ? 0 : ms;
  if (parsed.size >= PARSE_CACHE_MAX) parsed.clear();
  parsed.set(value, safe);
  return safe;
}

/** Most recently edited first. */
export function byUpdatedDesc(a: Timestamped, b: Timestamped): number {
  return time(b.updatedAt) - time(a.updatedAt);
}

/** Most recently added first. */
export function byCreatedDesc(a: Timestamped, b: Timestamped): number {
  return time(b.createdAt) - time(a.createdAt);
}

/** Alphabetical by title, in the reader's locale. */
export function byTitle(a: Titled, b: Titled): number {
  return a.title.localeCompare(b.title);
}

/**
 * Lifts pinned items above everything else, keeping `then` for the rest.
 *
 * A pin that only wins inside its own sort order is not a pin.
 */
export function pinnedFirst<T>(
  then: (a: T, b: T) => number,
): (a: T & Pinnable, b: T & Pinnable) => number {
  return (a, b) => {
    if (Boolean(a.pinned) !== Boolean(b.pinned)) return a.pinned ? -1 : 1;
    return then(a, b);
  };
}
