import { beforeEach, describe, expect, it } from "vitest";
import { usePalaceStore } from "@/lib/store";
import { DEFAULT_SETTINGS } from "@/lib/settings";

const store = () => usePalaceStore.getState();

/** A room plus two objects inside it, connected to each other. */
function seedRoomWithPair() {
  const room = store().createRoom({ name: "The Laboratory" });
  const a = store().createObject({ roomId: room.id, title: "A" });
  const b = store().createObject({ roomId: room.id, title: "B" });
  const connection = store().addConnection(a.id, b.id);
  return { room, a, b, connection };
}

beforeEach(() => {
  usePalaceStore.setState({
    version: 1,
    rooms: [],
    objects: [],
    connections: [],
    activity: [],
    settings: { ...DEFAULT_SETTINGS },
    hydrationState: "ready",
    hydrationError: null,
    activeObjectId: null,
    commandPaletteOpen: false,
    newRoomRequested: false,
  });
  window.localStorage.clear();
});

describe("rooms", () => {
  it("creates a room with defaults and logs the activity", () => {
    const room = store().createRoom({});
    expect(room.name).toBe("Untitled Room");
    expect(room.palette).toBe("brass");
    expect(store().rooms).toHaveLength(1);
    expect(store().activity[0]).toMatchObject({
      kind: "created",
      targetType: "room",
      targetId: room.id,
    });
  });

  it("ignores an update to a room that does not exist", () => {
    store().createRoom({ name: "Keep" });
    store().updateRoom("nope", { name: "Changed" });
    expect(store().rooms[0].name).toBe("Keep");
  });

  it("cascades a room deletion to its objects and their connections", () => {
    const { room, a } = seedRoomWithPair();
    const other = store().createRoom({ name: "Other" });
    const outsider = store().createObject({ roomId: other.id, title: "C" });
    const crossLink = store().addConnection(a.id, outsider.id);
    expect(crossLink).not.toBeNull();

    store().deleteRoom(room.id);

    expect(store().rooms.map((r) => r.id)).toEqual([other.id]);
    expect(store().objects.map((o) => o.id)).toEqual([outsider.id]);
    // Both the intra-room link and the link that reached out of it are gone.
    expect(store().connections).toHaveLength(0);
  });

  it("leaves unrelated rooms untouched when deleting", () => {
    const keep = store().createRoom({ name: "Keep" });
    const drop = store().createRoom({ name: "Drop" });
    store().deleteRoom(drop.id);
    expect(store().rooms.map((r) => r.id)).toEqual([keep.id]);
  });
});

describe("objects", () => {
  it("creates an object with defaults", () => {
    const room = store().createRoom({});
    const object = store().createObject({ roomId: room.id });
    expect(object).toMatchObject({
      type: "note",
      title: "Untitled",
      content: "",
      tags: [],
      position: { x: 50, y: 50 },
    });
  });

  it("stamps updatedAt on every update", async () => {
    const room = store().createRoom({});
    const object = store().createObject({ roomId: room.id });
    await new Promise((r) => setTimeout(r, 2));
    store().updateObject(object.id, { title: "Renamed" });
    const updated = store().objects[0];
    expect(updated.title).toBe("Renamed");
    expect(new Date(updated.updatedAt).getTime()).toBeGreaterThanOrEqual(
      new Date(object.createdAt).getTime(),
    );
  });

  it("cannot change an object's id through a patch", () => {
    const room = store().createRoom({});
    const object = store().createObject({ roomId: room.id });
    store().updateObject(object.id, { id: "hijacked" } as never);
    expect(store().objects[0].id).toBe(object.id);
  });

  it("deletes an object together with every connection touching it", () => {
    const { a, b } = seedRoomWithPair();
    store().deleteObject(a.id);
    expect(store().objects.map((o) => o.id)).toEqual([b.id]);
    expect(store().connections).toHaveLength(0);
  });

  it("closes the editor when the open object is deleted", () => {
    const { a } = seedRoomWithPair();
    store().openObject(a.id);
    expect(store().activeObjectId).toBe(a.id);
    store().deleteObject(a.id);
    expect(store().activeObjectId).toBeNull();
  });

  it("keeps the editor open when a different object is deleted", () => {
    const { a, b } = seedRoomWithPair();
    store().openObject(a.id);
    store().deleteObject(b.id);
    expect(store().activeObjectId).toBe(a.id);
  });

  it("toggles the pin flag", () => {
    const room = store().createRoom({});
    const object = store().createObject({ roomId: room.id });
    store().togglePin(object.id);
    expect(store().objects[0].pinned).toBe(true);
    store().togglePin(object.id);
    expect(store().objects[0].pinned).toBe(false);
  });

  it("restores a deleted object and its connections exactly once", () => {
    const { a, b } = seedRoomWithPair();
    const snapshot = store().objects.find((o) => o.id === a.id)!;
    const related = store().connections.filter(
      (c) => c.fromId === a.id || c.toId === a.id,
    );
    store().deleteObject(a.id);

    store().restoreObject(snapshot, related);
    expect(store().objects).toHaveLength(2);
    expect(store().connections).toHaveLength(1);

    // Restoring again is a no-op rather than a duplicate.
    store().restoreObject(snapshot, related);
    expect(store().objects).toHaveLength(2);
    expect(store().connections).toHaveLength(1);
    expect(b.id).toBeTruthy();
  });
});

describe("connections", () => {
  it("refuses to connect an object to itself", () => {
    const { a } = seedRoomWithPair();
    expect(store().addConnection(a.id, a.id)).toBeNull();
  });

  it("refuses a duplicate connection in either direction", () => {
    const { a, b } = seedRoomWithPair();
    expect(store().addConnection(a.id, b.id)).toBeNull();
    expect(store().addConnection(b.id, a.id)).toBeNull();
    expect(store().connections).toHaveLength(1);
  });

  it("stores a label only when one is given", () => {
    const room = store().createRoom({});
    const a = store().createObject({ roomId: room.id });
    const b = store().createObject({ roomId: room.id });
    const c = store().createObject({ roomId: room.id });
    const bare = store().addConnection(a.id, b.id);
    const labelled = store().addConnection(a.id, c.id, "supports");
    expect(bare).not.toHaveProperty("label");
    expect(labelled?.label).toBe("supports");
  });

  it("removes a connection by id", () => {
    const { connection } = seedRoomWithPair();
    store().removeConnection(connection!.id);
    expect(store().connections).toHaveLength(0);
  });

  it("logs a removal as disconnected, not connected", () => {
    const { connection } = seedRoomWithPair();
    store().removeConnection(connection!.id);
    expect(store().activity[0].kind).toBe("disconnected");
  });
});

describe("activity log", () => {
  it("caps the log at 50 entries, newest first", () => {
    const room = store().createRoom({});
    for (let i = 0; i < 60; i += 1) {
      store().createObject({ roomId: room.id, title: `Object ${i}` });
    }
    expect(store().activity).toHaveLength(50);
    expect(store().activity[0].targetTitle).toBe("Object 59");
  });
});

describe("data lifecycle", () => {
  it("exports exactly the persistable slice, without UI state", () => {
    seedRoomWithPair();
    store().openObject(store().objects[0].id);
    const exported = store().exportData();
    expect(Object.keys(exported).sort()).toEqual([
      "activity",
      "connections",
      "objects",
      "rooms",
      "settings",
      "version",
    ]);
  });

  it("round-trips an export back through import", () => {
    seedRoomWithPair();
    const exported = store().exportData();
    store().clearAll();
    expect(store().rooms).toHaveLength(0);

    store().importData(exported);
    expect(store().rooms).toHaveLength(1);
    expect(store().objects).toHaveLength(2);
    expect(store().connections).toHaveLength(1);
  });

  it("clears the open editor when importing", () => {
    seedRoomWithPair();
    store().openObject(store().objects[0].id);
    store().importData(store().exportData());
    expect(store().activeObjectId).toBeNull();
  });

  it("resets to a populated sample palace", () => {
    store().clearAll();
    store().resetToSample();
    expect(store().rooms.length).toBeGreaterThan(0);
    expect(store().objects.length).toBeGreaterThan(0);
  });

  it("clearAll empties everything and restores default settings", () => {
    seedRoomWithPair();
    store().updateSettings({ accent: "sage" });
    store().clearAll();
    expect(store().rooms).toEqual([]);
    expect(store().objects).toEqual([]);
    expect(store().connections).toEqual([]);
    expect(store().activity).toEqual([]);
    expect(store().settings).toEqual(DEFAULT_SETTINGS);
  });

  it("merges settings patches instead of replacing them", () => {
    store().updateSettings({ accent: "copper" });
    store().updateSettings({ reduceMotion: true });
    expect(store().settings).toMatchObject({
      accent: "copper",
      reduceMotion: true,
      textSize: DEFAULT_SETTINGS.textSize,
    });
  });
});
