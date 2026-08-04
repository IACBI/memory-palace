import { describe, expect, it } from "vitest";
import { findFreeSlot, GRID_COLS, GRID_ROWS } from "@/lib/layout";
import { makeRoom } from "../factories";

/** Fills the whole grid with 1x1 rooms. */
function fullGrid() {
  const rooms = [];
  for (let y = 0; y < GRID_ROWS; y += 1) {
    for (let x = 0; x < GRID_COLS; x += 1) {
      rooms.push(makeRoom({ position: { x, y, w: 1, h: 1 } }));
    }
  }
  return rooms;
}

describe("findFreeSlot", () => {
  it("places the first room at the origin", () => {
    expect(findFreeSlot([], 2, 2)).toEqual({ x: 0, y: 0, w: 2, h: 2 });
  });

  it("scans left-to-right before moving down a row", () => {
    const rooms = [makeRoom({ position: { x: 0, y: 0, w: 2, h: 2 } })];
    expect(findFreeSlot(rooms, 2, 2)).toEqual({ x: 2, y: 0, w: 2, h: 2 });
  });

  it("moves to the next row once the first is full", () => {
    const rooms = [];
    for (let x = 0; x < GRID_COLS; x += 2) {
      rooms.push(makeRoom({ position: { x, y: 0, w: 2, h: 2 } }));
    }
    expect(findFreeSlot(rooms, 2, 2)).toEqual({ x: 0, y: 2, w: 2, h: 2 });
  });

  it("never overlaps an existing room", () => {
    const rooms = [makeRoom({ position: { x: 1, y: 0, w: 3, h: 3 } })];
    const slot = findFreeSlot(rooms, 2, 2);
    const overlaps =
      slot.x < 4 && slot.x + slot.w > 1 && slot.y < 3 && slot.y + slot.h > 0;
    expect(overlaps).toBe(false);
  });

  it("degrades through the size chain when the requested size will not fit", () => {
    // Leave exactly one free column on the right, so only a 1-wide room fits.
    const rooms = [];
    for (let y = 0; y < GRID_ROWS; y += 1) {
      rooms.push(makeRoom({ position: { x: 0, y, w: GRID_COLS - 1, h: 1 } }));
    }
    const slot = findFreeSlot(rooms, 4, 4);
    expect(slot.w).toBe(1);
    expect(slot.x).toBe(GRID_COLS - 1);
  });

  it("prefers 2x2 over smaller sizes when the request does not fit", () => {
    // Occupy the top three rows, leaving five — too few for a 6-tall room,
    // but plenty for the 2x2 next in the size chain.
    const rooms = [];
    for (let x = 0; x < GRID_COLS; x += 1) {
      rooms.push(makeRoom({ position: { x, y: 0, w: 1, h: 3 } }));
    }
    const slot = findFreeSlot(rooms, 6, 6);
    expect(slot).toEqual({ x: 0, y: 3, w: 2, h: 2 });
  });

  it("falls back to the origin at the requested size when the grid is full", () => {
    expect(findFreeSlot(fullGrid(), 3, 3)).toEqual({ x: 0, y: 0, w: 3, h: 3 });
  });

  it("keeps every slot inside the grid bounds", () => {
    const rooms = [makeRoom({ position: { x: 0, y: 0, w: 10, h: 8 } })];
    const slot = findFreeSlot(rooms, 2, 2);
    expect(slot.x + slot.w).toBeLessThanOrEqual(GRID_COLS);
    expect(slot.y + slot.h).toBeLessThanOrEqual(GRID_ROWS);
  });
});
