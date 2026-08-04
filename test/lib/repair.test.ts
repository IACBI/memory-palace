import { describe, expect, it } from "vitest";
import { repairPalaceData } from "@/lib/storage/repair";
import { GRID_COLS, GRID_ROWS } from "@/lib/layout";
import {
  makeActivity,
  makeConnection,
  makeObject,
  makePalaceData,
  makeRoom,
} from "../factories";

const kinds = (result: ReturnType<typeof repairPalaceData>) =>
  result.repairs.map((r) => r.kind);

describe("repairPalaceData", () => {
  it("leaves a clean palace untouched and reports nothing", () => {
    const room = makeRoom({ id: "r1" });
    const a = makeObject({ id: "a", roomId: "r1" });
    const b = makeObject({ id: "b", roomId: "r1" });
    const input = makePalaceData({
      rooms: [room],
      objects: [a, b],
      connections: [makeConnection({ fromId: "a", toId: "b" })],
    });

    const result = repairPalaceData(input);
    expect(result.repairs).toEqual([]);
    expect(result.data.rooms).toHaveLength(1);
    expect(result.data.objects).toHaveLength(2);
    expect(result.data.connections).toHaveLength(1);
  });

  it("pulls a zero-width room back to a usable size", () => {
    const room = makeRoom({ position: { x: 0, y: 0, w: 0, h: 2 } });
    const result = repairPalaceData(makePalaceData({ rooms: [room] }));

    expect(result.data.rooms[0].position.w).toBeGreaterThanOrEqual(1);
    expect(kinds(result)).toContain("clamped-position");
  });

  it("pulls a room positioned off the grid back onto it", () => {
    const room = makeRoom({ position: { x: 9999, y: -4, w: 2, h: 2 } });
    const { position } = repairPalaceData(makePalaceData({ rooms: [room] }))
      .data.rooms[0];

    expect(position.x).toBeGreaterThanOrEqual(0);
    expect(position.y).toBeGreaterThanOrEqual(0);
    expect(position.x + position.w).toBeLessThanOrEqual(GRID_COLS);
    expect(position.y + position.h).toBeLessThanOrEqual(GRID_ROWS);
  });

  it("brings an object positioned off its canvas back into view", () => {
    const room = makeRoom({ id: "r1" });
    const object = makeObject({ roomId: "r1", position: { x: -500, y: 400 } });
    const result = repairPalaceData(
      makePalaceData({ rooms: [room], objects: [object] }),
    );

    expect(result.data.objects[0].position).toEqual({ x: 3, y: 97 });
    expect(kinds(result)).toContain("clamped-position");
  });

  it("moves an orphaned object into a generated Unfiled room", () => {
    const object = makeObject({ roomId: "missing", title: "Stray" });
    const result = repairPalaceData(makePalaceData({ objects: [object] }));

    const unfiled = result.data.rooms.find((r) => r.name === "Unfiled");
    expect(unfiled).toBeDefined();
    expect(result.data.objects[0].roomId).toBe(unfiled!.id);
    expect(kinds(result)).toContain("orphan-object");
  });

  it("creates only one Unfiled room for many orphans", () => {
    const objects = [
      makeObject({ roomId: "gone" }),
      makeObject({ roomId: "also-gone" }),
    ];
    const result = repairPalaceData(makePalaceData({ objects }));
    expect(result.data.rooms.filter((r) => r.name === "Unfiled")).toHaveLength(
      1,
    );
  });

  it("regenerates duplicate ids rather than losing a record", () => {
    const objects = [
      makeObject({ id: "same", title: "First", roomId: "r1" }),
      makeObject({ id: "same", title: "Second", roomId: "r1" }),
    ];
    const result = repairPalaceData(
      makePalaceData({ rooms: [makeRoom({ id: "r1" })], objects }),
    );

    expect(result.data.objects).toHaveLength(2);
    const ids = result.data.objects.map((o) => o.id);
    expect(new Set(ids).size).toBe(2);
    expect(kinds(result)).toContain("duplicate-id");
  });

  it("drops connections whose ends are missing", () => {
    const room = makeRoom({ id: "r1" });
    const a = makeObject({ id: "a", roomId: "r1" });
    const result = repairPalaceData(
      makePalaceData({
        rooms: [room],
        objects: [a],
        connections: [makeConnection({ fromId: "a", toId: "vanished" })],
      }),
    );

    expect(result.data.connections).toEqual([]);
    expect(kinds(result)).toContain("broken-connection");
  });

  it("drops self-links and duplicate pairs", () => {
    const room = makeRoom({ id: "r1" });
    const a = makeObject({ id: "a", roomId: "r1" });
    const b = makeObject({ id: "b", roomId: "r1" });
    const result = repairPalaceData(
      makePalaceData({
        rooms: [room],
        objects: [a, b],
        connections: [
          makeConnection({ fromId: "a", toId: "a" }),
          makeConnection({ fromId: "a", toId: "b" }),
          makeConnection({ fromId: "b", toId: "a" }),
        ],
      }),
    );

    expect(result.data.connections).toHaveLength(1);
  });

  it("strips a link the app would refuse to open", () => {
    const room = makeRoom({ id: "r1" });
    const object = makeObject({
      roomId: "r1",
      type: "link",
      url: "javascript:alert(1)",
    });
    const result = repairPalaceData(
      makePalaceData({ rooms: [room], objects: [object] }),
    );

    expect(result.data.objects[0]).not.toHaveProperty("url");
    expect(kinds(result)).toContain("unsafe-url");
  });

  it("keeps a safe link", () => {
    const room = makeRoom({ id: "r1" });
    const object = makeObject({
      roomId: "r1",
      type: "link",
      url: "https://example.com",
    });
    const result = repairPalaceData(
      makePalaceData({ rooms: [room], objects: [object] }),
    );

    expect(result.data.objects[0].url).toBe("https://example.com");
    expect(result.repairs).toEqual([]);
  });

  it("trims an over-long activity log instead of rejecting the file", () => {
    const activity = Array.from({ length: 120 }, () => makeActivity());
    const result = repairPalaceData(makePalaceData({ activity }));

    expect(result.data.activity).toHaveLength(50);
    expect(kinds(result)).toContain("truncated-activity");
  });

  it("explains every repair in words a person can act on", () => {
    const result = repairPalaceData(
      makePalaceData({ objects: [makeObject({ roomId: "gone" })] }),
    );
    for (const repair of result.repairs) {
      expect(repair.detail.length).toBeGreaterThan(20);
      expect(repair.detail).toMatch(/[.!]$/);
    }
  });
});
