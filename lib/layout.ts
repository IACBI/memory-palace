import type { Room, RoomPosition } from "@/lib/types";

export const GRID_COLS = 12;
export const GRID_ROWS = 8;

function overlaps(a: RoomPosition, b: RoomPosition): boolean {
  return (
    a.x < b.x + b.w &&
    a.x + a.w > b.x &&
    a.y < b.y + b.h &&
    a.y + a.h > b.y
  );
}

function scan(rooms: Room[], w: number, h: number): RoomPosition | null {
  for (let y = 0; y + h <= GRID_ROWS; y += 1) {
    for (let x = 0; x + w <= GRID_COLS; x += 1) {
      const candidate: RoomPosition = { x, y, w, h };
      if (!rooms.some((room) => overlaps(room.position, candidate))) {
        return candidate;
      }
    }
  }
  return null;
}

/**
 * Finds the first free grid slot (scanning top-to-bottom, left-to-right) that
 * fits a room of the requested size without overlapping existing rooms. If the
 * requested size does not fit, the size is progressively reduced so a new room
 * can still be placed whenever any cell is free. Falls back to {0,0} only when
 * the grid is completely full.
 */
export function findFreeSlot(
  rooms: Room[],
  w: number,
  h: number,
): RoomPosition {
  const sizes: Array<[number, number]> = [
    [w, h],
    [2, 2],
    [2, 1],
    [1, 2],
    [1, 1],
  ];
  for (const [cw, ch] of sizes) {
    const found = scan(rooms, cw, ch);
    if (found) return found;
  }
  return { x: 0, y: 0, w, h };
}
