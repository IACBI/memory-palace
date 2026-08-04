import { describe, expect, it } from "vitest";
import { validatePalaceData } from "@/lib/storage/local-storage";
import { createSeedData } from "@/lib/seed-data";
import { DEFAULT_SETTINGS } from "@/lib/settings";
import {
  makeActivity,
  makeConnection,
  makeObject,
  makePalaceData,
  makeRoom,
} from "../factories";

/** Round-trips through JSON the way a real export/import does. */
const roundTrip = (value: unknown) => JSON.parse(JSON.stringify(value));

describe("validatePalaceData", () => {
  it("accepts the seed palace unchanged", () => {
    const seed = createSeedData();
    const result = validatePalaceData(roundTrip(seed));
    expect(result).not.toBeNull();
    expect(result!.rooms).toHaveLength(seed.rooms.length);
    expect(result!.objects).toHaveLength(seed.objects.length);
    expect(result!.connections).toHaveLength(seed.connections.length);
  });

  it("returns a fresh copy rather than the input", () => {
    const input = roundTrip(makePalaceData({ rooms: [makeRoom()] }));
    const result = validatePalaceData(input);
    expect(result).not.toBe(input);
    expect(result!.rooms[0]).not.toBe(input.rooms[0]);
  });

  it.each([
    ["null", null],
    ["a string", "not a palace"],
    ["an array", []],
    ["a number", 42],
  ])("rejects %s", (_label, value) => {
    expect(validatePalaceData(value)).toBeNull();
  });

  it("rejects an unknown schema version", () => {
    expect(
      validatePalaceData(makePalaceData({ version: 2 as never })),
    ).toBeNull();
  });

  it.each(["rooms", "objects", "connections", "activity"])(
    "rejects a non-array %s collection",
    (key) => {
      const data = { ...makePalaceData(), [key]: "nope" };
      expect(validatePalaceData(data)).toBeNull();
    },
  );

  it("rejects a room with a missing field", () => {
    const room = makeRoom() as unknown as Record<string, unknown>;
    delete room.icon;
    expect(
      validatePalaceData(makePalaceData({ rooms: [room as never] })),
    ).toBeNull();
  });

  it("rejects a room with an unknown palette", () => {
    const room = makeRoom({ palette: "chartreuse" as never });
    expect(validatePalaceData(makePalaceData({ rooms: [room] }))).toBeNull();
  });

  it("rejects a non-finite room position", () => {
    const room = makeRoom({ position: { x: NaN, y: 0, w: 2, h: 2 } });
    expect(validatePalaceData(makePalaceData({ rooms: [room] }))).toBeNull();
  });

  it("rejects an object with an unknown type", () => {
    const object = makeObject({ type: "hologram" as never });
    expect(
      validatePalaceData(makePalaceData({ objects: [object] })),
    ).toBeNull();
  });

  it("rejects an object whose tags are not all strings", () => {
    const object = makeObject({ tags: ["ok", 7 as never] });
    expect(
      validatePalaceData(makePalaceData({ objects: [object] })),
    ).toBeNull();
  });

  it("rejects an activity event with an unknown kind", () => {
    const event = makeActivity({ kind: "exploded" as never });
    expect(
      validatePalaceData(makePalaceData({ activity: [event] })),
    ).toBeNull();
  });

  it("preserves optional object fields only when present", () => {
    const bare = makeObject();
    const rich = makeObject({
      url: "https://example.com",
      fileName: "notes.pdf",
      pinned: true,
    });
    const result = validatePalaceData(
      roundTrip(makePalaceData({ objects: [bare, rich] })),
    );
    expect(result!.objects[0]).not.toHaveProperty("url");
    expect(result!.objects[1].url).toBe("https://example.com");
    expect(result!.objects[1].pinned).toBe(true);
  });

  it("preserves a connection label when present", () => {
    const labelled = makeConnection({ label: "supports" });
    const result = validatePalaceData(
      makePalaceData({ connections: [labelled] }),
    );
    expect(result!.connections[0].label).toBe("supports");
  });

  it("repairs bad settings instead of rejecting the document", () => {
    const data = { ...makePalaceData(), settings: { accent: "chartreuse" } };
    const result = validatePalaceData(data);
    expect(result).not.toBeNull();
    expect(result!.settings).toEqual(DEFAULT_SETTINGS);
  });

  it("accepts a document with no settings at all", () => {
    const data = { ...makePalaceData(), settings: undefined };
    expect(validatePalaceData(data)!.settings).toEqual(DEFAULT_SETTINGS);
  });
});
