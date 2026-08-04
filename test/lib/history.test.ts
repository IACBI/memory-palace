import { describe, expect, it } from "vitest";
import {
  COALESCE_WINDOW_MS,
  EMPTY_HISTORY,
  HISTORY_LIMIT,
  pushHistory,
  redo,
  undo,
} from "@/lib/history";
import { makeObject, makePalaceData, makeRoom } from "../factories";

const snapshot = (label: string) =>
  makePalaceData({ rooms: [makeRoom({ name: label })] });

const entry = (label: string, coalesceKey: string | null = null) => ({
  snapshot: snapshot(label),
  label,
  coalesceKey,
});

describe("pushHistory", () => {
  it("records the state before a change", () => {
    const history = pushHistory(EMPTY_HISTORY, entry("first"));
    expect(history.past).toHaveLength(1);
    expect(history.past[0].label).toBe("first");
  });

  it("puts the most recent change first", () => {
    let history = pushHistory(EMPTY_HISTORY, entry("first"));
    history = pushHistory(history, entry("second"));
    expect(history.past.map((e) => e.label)).toEqual(["second", "first"]);
  });

  it("caps the stack", () => {
    let history = EMPTY_HISTORY;
    for (let i = 0; i < HISTORY_LIMIT + 20; i += 1) {
      history = pushHistory(history, entry(`change ${i}`));
    }
    expect(history.past).toHaveLength(HISTORY_LIMIT);
    expect(history.past[0].label).toBe(`change ${HISTORY_LIMIT + 19}`);
  });

  it("collapses a burst of edits to the same target", () => {
    const at = 1_000;
    let history = pushHistory(EMPTY_HISTORY, entry("typing", "title:o1"), at);
    history = pushHistory(history, entry("typing", "title:o1"), at + 100);
    history = pushHistory(history, entry("typing", "title:o1"), at + 200);

    expect(history.past).toHaveLength(1);
  });

  it("keeps the oldest snapshot when collapsing, so undo lands before the burst", () => {
    const at = 1_000;
    const first = entry("typing", "title:o1");
    let history = pushHistory(EMPTY_HISTORY, first, at);
    history = pushHistory(history, entry("typing", "title:o1"), at + 100);

    expect(history.past[0].snapshot).toBe(first.snapshot);
  });

  it("starts a new step once the burst pauses", () => {
    const at = 1_000;
    let history = pushHistory(EMPTY_HISTORY, entry("typing", "title:o1"), at);
    history = pushHistory(
      history,
      entry("typing", "title:o1"),
      at + COALESCE_WINDOW_MS + 1,
    );
    expect(history.past).toHaveLength(2);
  });

  it("never collapses edits to different targets", () => {
    const at = 1_000;
    let history = pushHistory(EMPTY_HISTORY, entry("a", "title:o1"), at);
    history = pushHistory(history, entry("b", "title:o2"), at + 10);
    expect(history.past).toHaveLength(2);
  });

  it("never collapses when no coalesce key is given", () => {
    const at = 1_000;
    let history = pushHistory(EMPTY_HISTORY, entry("delete"), at);
    history = pushHistory(history, entry("delete"), at + 10);
    expect(history.past).toHaveLength(2);
  });

  it("abandons the redo branch on a new change", () => {
    let history = pushHistory(EMPTY_HISTORY, entry("first"));
    const undone = undo(history, snapshot("current"))!;
    expect(undone.history.future).toHaveLength(1);

    history = pushHistory(undone.history, entry("diverged"));
    expect(history.future).toEqual([]);
  });
});

describe("undo and redo", () => {
  it("returns null when there is nothing to undo", () => {
    expect(undo(EMPTY_HISTORY, snapshot("now"))).toBeNull();
    expect(redo(EMPTY_HISTORY, snapshot("now"))).toBeNull();
  });

  it("hands back the snapshot to apply, and its label", () => {
    const before = snapshot("before");
    const history = pushHistory(EMPTY_HISTORY, {
      snapshot: before,
      label: "deleted The Laboratory",
      coalesceKey: null,
    });

    const result = undo(history, snapshot("after"))!;
    expect(result.apply).toBe(before);
    expect(result.label).toBe("deleted The Laboratory");
  });

  it("round-trips: undo then redo returns the later state", () => {
    const before = snapshot("before");
    const after = snapshot("after");
    const history = pushHistory(EMPTY_HISTORY, {
      snapshot: before,
      label: "change",
      coalesceKey: null,
    });

    const undone = undo(history, after)!;
    expect(undone.apply).toBe(before);

    const redone = redo(undone.history, before)!;
    expect(redone.apply).toBe(after);
    expect(redone.history.past).toHaveLength(1);
    expect(redone.history.future).toEqual([]);
  });

  it("walks back through several steps in order", () => {
    let history = pushHistory(EMPTY_HISTORY, entry("one"));
    history = pushHistory(history, entry("two"));
    history = pushHistory(history, entry("three"));

    const labels: string[] = [];
    let current = snapshot("now");
    for (let i = 0; i < 3; i += 1) {
      const result = undo(history, current)!;
      labels.push(result.label);
      history = result.history;
      current = result.apply;
    }
    expect(labels).toEqual(["three", "two", "one"]);
  });
});

describe("memory", () => {
  /**
   * Snapshot undo is only affordable because untouched collections are shared
   * by reference rather than copied.
   */
  it("shares the arrays a change did not touch", () => {
    const rooms = [makeRoom()];
    const objects = [makeObject()];
    const before = makePalaceData({ rooms, objects });
    // A room edit replaces `rooms` but leaves `objects` alone.
    const after = { ...before, rooms: [makeRoom({ name: "Renamed" })] };

    const history = pushHistory(EMPTY_HISTORY, {
      snapshot: before,
      label: "renamed",
      coalesceKey: null,
    });

    expect(history.past[0].snapshot.objects).toBe(after.objects);
  });
});
