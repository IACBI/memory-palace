import { GRID_COLS, GRID_ROWS } from "@/lib/layout";
import { newId } from "@/lib/id";
import { isSafeHref } from "@/lib/storage/url";
import type { PalaceData, Room } from "@/lib/types";

/** One thing that had to be changed to make an imported palace usable. */
export interface Repair {
  kind:
    | "duplicate-id"
    | "orphan-object"
    | "broken-connection"
    | "clamped-position"
    | "unsafe-url"
    | "truncated-activity";
  detail: string;
}

export interface RepairResult {
  data: PalaceData;
  repairs: Repair[];
}

const ACTIVITY_CAP = 50;
const clamp = (v: number, min: number, max: number) =>
  Math.min(max, Math.max(min, v));

function makeUnfiledRoom(): Room {
  const now = new Date().toISOString();
  return {
    id: newId(),
    name: "Unfiled",
    description: "Objects whose room was missing from the imported file.",
    icon: "Archive",
    palette: "umber",
    position: { x: 0, y: 0, w: 2, h: 2 },
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Makes a structurally valid palace *usable*, reporting every change.
 *
 * Rejecting a whole file over one bad record is the wrong trade for a personal
 * knowledge tool: "invalid file" loses everything, where "we fixed three
 * things, here they are" loses nothing. Only unreadable JSON and an unknown
 * schema version are hard failures — those happen before this runs.
 */
export function repairPalaceData(input: PalaceData): RepairResult {
  const repairs: Repair[] = [];

  // --- Rooms: unique ids, positions inside the grid ---
  const seenRoomIds = new Set<string>();
  const rooms: Room[] = input.rooms.map((room) => {
    let id = room.id;
    if (seenRoomIds.has(id)) {
      id = newId();
      repairs.push({
        kind: "duplicate-id",
        detail: `Room "${room.name}" shared an id with another room.`,
      });
    }
    seenRoomIds.add(id);

    const w = clamp(Math.round(room.position.w) || 1, 1, GRID_COLS);
    const h = clamp(Math.round(room.position.h) || 1, 1, GRID_ROWS);
    const x = clamp(Math.round(room.position.x), 0, GRID_COLS - w);
    const y = clamp(Math.round(room.position.y), 0, GRID_ROWS - h);
    const moved =
      x !== room.position.x ||
      y !== room.position.y ||
      w !== room.position.w ||
      h !== room.position.h;
    if (moved) {
      repairs.push({
        kind: "clamped-position",
        detail: `Room "${room.name}" sat outside the floor plan and was moved back onto it.`,
      });
    }

    return { ...room, id, position: { x, y, w, h } };
  });

  // Room ids may have been rewritten; objects referencing the old ones follow.
  const remappedRoomIds = new Map<string, string>();
  input.rooms.forEach((room, index) => {
    if (!remappedRoomIds.has(room.id)) {
      remappedRoomIds.set(room.id, rooms[index].id);
    }
  });

  const knownRoomIds = new Set(rooms.map((r) => r.id));
  let unfiled: Room | null = null;

  // --- Objects: unique ids, a real room, positions on the canvas, safe URLs ---
  const seenObjectIds = new Set<string>();
  const objects = input.objects.map((object) => {
    let id = object.id;
    if (seenObjectIds.has(id)) {
      id = newId();
      repairs.push({
        kind: "duplicate-id",
        detail: `Object "${object.title}" shared an id with another object.`,
      });
    }
    seenObjectIds.add(id);

    let roomId = remappedRoomIds.get(object.roomId) ?? object.roomId;
    if (!knownRoomIds.has(roomId)) {
      unfiled ??= makeUnfiledRoom();
      roomId = unfiled.id;
      repairs.push({
        kind: "orphan-object",
        detail: `Object "${object.title}" pointed at a room that isn't in the file; moved to Unfiled.`,
      });
    }

    const x = clamp(object.position.x, 3, 97);
    const y = clamp(object.position.y, 3, 97);
    if (x !== object.position.x || y !== object.position.y) {
      repairs.push({
        kind: "clamped-position",
        detail: `Object "${object.title}" was positioned off its canvas and has been moved back into view.`,
      });
    }

    const next = { ...object, id, roomId, position: { x, y } };
    if (next.url !== undefined && !isSafeHref(next.url)) {
      delete next.url;
      repairs.push({
        kind: "unsafe-url",
        detail: `Object "${object.title}" had a link the app won't open; the link was removed.`,
      });
    }
    return next;
  });

  if (unfiled) rooms.push(unfiled);

  // --- Connections: both ends must exist, no self-links, no duplicates ---
  const objectIds = new Set(objects.map((o) => o.id));
  const seenPairs = new Set<string>();
  const connections = input.connections.filter((connection) => {
    const ok =
      objectIds.has(connection.fromId) &&
      objectIds.has(connection.toId) &&
      connection.fromId !== connection.toId;
    if (!ok) {
      repairs.push({
        kind: "broken-connection",
        detail: "A connection referenced an object that isn't in the file.",
      });
      return false;
    }
    const pair = [connection.fromId, connection.toId].sort().join("::");
    if (seenPairs.has(pair)) {
      repairs.push({
        kind: "broken-connection",
        detail:
          "A duplicate connection between the same two objects was dropped.",
      });
      return false;
    }
    seenPairs.add(pair);
    return true;
  });

  // --- Activity: capped, and only pointing at things that exist ---
  let activity = input.activity;
  if (activity.length > ACTIVITY_CAP) {
    activity = activity.slice(0, ACTIVITY_CAP);
    repairs.push({
      kind: "truncated-activity",
      detail: `The activity log was trimmed to the most recent ${ACTIVITY_CAP} entries.`,
    });
  }

  return {
    data: {
      version: 1,
      rooms,
      objects,
      connections,
      activity,
      settings: input.settings,
    },
    repairs,
  };
}
