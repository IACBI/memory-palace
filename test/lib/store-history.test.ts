import { beforeEach, describe, expect, it } from "vitest";
import { usePalaceStore } from "@/lib/store";
import { EMPTY_HISTORY } from "@/lib/history";
import { DEFAULT_SETTINGS } from "@/lib/settings";

const store = () => usePalaceStore.getState();

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
    history: EMPTY_HISTORY,
  });
  window.localStorage.clear();
});

describe("undo", () => {
  it("does nothing when there is no history", () => {
    expect(store().undo()).toBeNull();
    expect(store().canUndo()).toBe(false);
  });

  it("reverses creating a room", () => {
    store().createRoom({ name: "Observatory" });
    expect(store().rooms).toHaveLength(1);

    expect(store().undo()).toBeTruthy();
    expect(store().rooms).toEqual([]);
  });

  /**
   * The headline case. Deleting a room cascades to every object in it and
   * every connection those objects had, and had no undo at all.
   */
  it("restores a deleted room with all of its objects and connections", () => {
    const room = store().createRoom({ name: "The Laboratory" });
    const a = store().createObject({ roomId: room.id, title: "A" });
    const b = store().createObject({ roomId: room.id, title: "B" });
    store().addConnection(a.id, b.id);

    store().deleteRoom(room.id);
    expect(store().rooms).toEqual([]);
    expect(store().objects).toEqual([]);
    expect(store().connections).toEqual([]);

    const label = store().undo();
    expect(label).toMatch(/room/i);
    expect(store().rooms).toHaveLength(1);
    expect(store().objects).toHaveLength(2);
    expect(store().connections).toHaveLength(1);
  });

  it("reverses deleting an object and its connections", () => {
    const room = store().createRoom({});
    const a = store().createObject({ roomId: room.id, title: "A" });
    const b = store().createObject({ roomId: room.id, title: "B" });
    store().addConnection(a.id, b.id);

    store().deleteObject(a.id);
    expect(store().objects).toHaveLength(1);
    expect(store().connections).toHaveLength(0);

    store().undo();
    expect(store().objects).toHaveLength(2);
    expect(store().connections).toHaveLength(1);
    expect(b.id).toBeTruthy();
  });

  it("walks back through several changes in order", () => {
    store().createRoom({ name: "One" });
    store().createRoom({ name: "Two" });
    store().createRoom({ name: "Three" });
    expect(store().rooms).toHaveLength(3);

    store().undo();
    expect(store().rooms.map((r) => r.name)).toEqual(["One", "Two"]);
    store().undo();
    expect(store().rooms.map((r) => r.name)).toEqual(["One"]);
    store().undo();
    expect(store().rooms).toEqual([]);
    expect(store().canUndo()).toBe(false);
  });

  it("closes the editor, since the open object may not exist afterwards", () => {
    const room = store().createRoom({});
    const object = store().createObject({ roomId: room.id });
    store().openObject(object.id);

    store().undo();
    expect(store().activeObjectId).toBeNull();
  });

  it("records nothing for an action whose target does not exist", () => {
    store().createRoom({ name: "Keep" });
    const depth = store().history.past.length;

    store().updateRoom("no-such-room", { name: "x" });
    store().deleteObject("no-such-object");

    expect(store().history.past.length).toBe(depth);
  });

  it("collapses a burst of edits to one object into a single step", () => {
    const room = store().createRoom({});
    const object = store().createObject({ roomId: room.id, title: "Start" });
    const depth = store().history.past.length;

    store().updateObject(object.id, { title: "S" });
    store().updateObject(object.id, { title: "St" });
    store().updateObject(object.id, { title: "Ste" });

    expect(store().history.past.length).toBe(depth + 1);

    store().undo();
    expect(store().objects[0].title).toBe("Start");
  });
});

describe("redo", () => {
  it("does nothing when nothing has been undone", () => {
    expect(store().redo()).toBeNull();
    expect(store().canRedo()).toBe(false);
  });

  it("reapplies an undone change", () => {
    store().createRoom({ name: "Observatory" });
    store().undo();
    expect(store().rooms).toEqual([]);

    expect(store().redo()).toBeTruthy();
    expect(store().rooms).toHaveLength(1);
    expect(store().rooms[0].name).toBe("Observatory");
  });

  it("is abandoned once a new change is made", () => {
    store().createRoom({ name: "One" });
    store().undo();
    expect(store().canRedo()).toBe(true);

    store().createRoom({ name: "Diverged" });
    expect(store().canRedo()).toBe(false);
  });

  it("round-trips a destructive change", () => {
    const room = store().createRoom({ name: "Doomed" });
    store().createObject({ roomId: room.id, title: "Inside" });

    store().deleteRoom(room.id);
    store().undo();
    expect(store().objects).toHaveLength(1);

    store().redo();
    expect(store().rooms).toEqual([]);
    expect(store().objects).toEqual([]);
  });
});

describe("destructive lifecycle actions", () => {
  it("makes resetting to the sample palace undoable", () => {
    store().createRoom({ name: "Mine" });
    store().resetToSample();
    expect(store().rooms.length).toBeGreaterThan(1);

    store().undo();
    expect(store().rooms.map((r) => r.name)).toEqual(["Mine"]);
  });

  it("makes importing undoable", () => {
    store().createRoom({ name: "Mine" });
    const exported = store().exportData();
    store().createRoom({ name: "Second" });

    store().importData(exported);
    expect(store().rooms.map((r) => r.name)).toEqual(["Mine"]);

    store().undo();
    expect(store().rooms.map((r) => r.name)).toEqual(["Mine", "Second"]);
  });
});
