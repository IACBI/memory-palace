import type { KnowledgeObject, Room } from "@/lib/types";

export interface ObjectSearchResult {
  kind: "object";
  object: KnowledgeObject;
  roomName: string | null;
  score: number;
}

export interface RoomSearchResult {
  kind: "room";
  room: Room;
  score: number;
}

export interface SearchResults {
  rooms: RoomSearchResult[];
  objects: ObjectSearchResult[];
}

function scoreObject(object: KnowledgeObject, q: string): number {
  const title = object.title.toLowerCase();
  let score = 0;
  if (title === q) score += 140;
  else if (title.startsWith(q)) score += 100;
  else if (title.includes(q)) score += 60;

  for (const tag of object.tags) {
    const t = tag.toLowerCase();
    if (t === q) score += 55;
    else if (t.includes(q)) score += 35;
  }

  if (object.content.toLowerCase().includes(q)) score += 15;
  if (object.url && object.url.toLowerCase().includes(q)) score += 10;
  if (object.fileName && object.fileName.toLowerCase().includes(q)) score += 10;
  return score;
}

function scoreRoom(room: Room, q: string): number {
  const name = room.name.toLowerCase();
  let score = 0;
  if (name === q) score += 140;
  else if (name.startsWith(q)) score += 100;
  else if (name.includes(q)) score += 60;
  if (room.description.toLowerCase().includes(q)) score += 20;
  return score;
}

/**
 * Scored full-text search across rooms and objects.
 * Title/name matches outrank tag matches, which outrank content matches.
 */
export function searchPalace(
  query: string,
  rooms: Room[],
  objects: KnowledgeObject[],
): SearchResults {
  const q = query.trim().toLowerCase();
  if (!q) return { rooms: [], objects: [] };

  const roomById = new Map(rooms.map((r) => [r.id, r]));

  const roomResults: RoomSearchResult[] = rooms
    .map((room) => ({ kind: "room" as const, room, score: scoreRoom(room, q) }))
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score);

  const objectResults: ObjectSearchResult[] = objects
    .map((object) => ({
      kind: "object" as const,
      object,
      roomName: roomById.get(object.roomId)?.name ?? null,
      score: scoreObject(object, q),
    }))
    .filter((r) => r.score > 0)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return (
        new Date(b.object.updatedAt).getTime() -
        new Date(a.object.updatedAt).getTime()
      );
    });

  return { rooms: roomResults, objects: objectResults };
}
