import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { activityPhrase, relativeTime } from "@/lib/activity-text";
import { ACTIVITY_KINDS } from "@/lib/types";
import { makeActivity, makeObject, makeRoom } from "../factories";

describe("activityPhrase", () => {
  const room = makeRoom({ id: "r1", name: "The Laboratory" });
  const object = makeObject({
    id: "o1",
    roomId: "r1",
    title: "Fermentation log",
  });

  it("names the room an object lives in", () => {
    const event = makeActivity({
      kind: "moved",
      targetType: "object",
      targetId: "o1",
      targetTitle: "Fermentation log",
    });
    expect(activityPhrase(event, [room], [object])).toBe(
      'Moved "Fermentation log" in The Laboratory',
    );
  });

  it("omits the room for room-targeted events", () => {
    const event = makeActivity({
      kind: "created",
      targetType: "room",
      targetId: "r1",
      targetTitle: "The Laboratory",
    });
    expect(activityPhrase(event, [room], [object])).toBe(
      'Added "The Laboratory"',
    );
  });

  it("omits the room when the object no longer exists", () => {
    const event = makeActivity({
      kind: "deleted",
      targetType: "object",
      targetId: "gone",
      targetTitle: "Fermentation log",
    });
    expect(activityPhrase(event, [room], [object])).toBe(
      'Removed "Fermentation log"',
    );
  });

  it('uses "from" for connection events and "in" for the rest', () => {
    const connected = makeActivity({ kind: "connected", targetId: "o1" });
    expect(activityPhrase(connected, [room], [object])).toContain(
      "from The Laboratory",
    );
    const updated = makeActivity({ kind: "updated", targetId: "o1" });
    expect(activityPhrase(updated, [room], [object])).toContain(
      "in The Laboratory",
    );
  });

  it("reads correctly when a connection is removed", () => {
    // This used to log `connected`, so deleting a link read "Connected X".
    const event = makeActivity({ kind: "disconnected", targetId: "o1" });
    expect(activityPhrase(event, [room], [object])).toBe(
      'Disconnected "Fermentation log" from The Laboratory',
    );
  });

  it("has a verb for every activity kind", () => {
    for (const kind of ACTIVITY_KINDS) {
      const phrase = activityPhrase(
        makeActivity({ kind, targetType: "room", targetTitle: "X" }),
        [],
        [],
      );
      expect(phrase).not.toContain("undefined");
      expect(phrase).toMatch(/^\w+ "X"$/);
    }
  });
});

describe("relativeTime", () => {
  const NOW = new Date("2026-06-15T12:00:00.000Z");

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const ago = (ms: number) => new Date(NOW.getTime() - ms).toISOString();

  it("reports sub-minute gaps as 'just now'", () => {
    expect(relativeTime(ago(0))).toBe("just now");
    expect(relativeTime(ago(29_000))).toBe("just now");
  });

  it("reports minutes below an hour", () => {
    expect(relativeTime(ago(5 * 60_000))).toBe("5m ago");
    expect(relativeTime(ago(59 * 60_000))).toBe("59m ago");
  });

  it("reports hours below a day", () => {
    expect(relativeTime(ago(2 * 3_600_000))).toBe("2h ago");
    expect(relativeTime(ago(23 * 3_600_000))).toBe("23h ago");
  });

  it("reports days below a month", () => {
    expect(relativeTime(ago(3 * 86_400_000))).toBe("3d ago");
    expect(relativeTime(ago(29 * 86_400_000))).toBe("29d ago");
  });

  it("falls back to an absolute date beyond 30 days", () => {
    const result = relativeTime(ago(60 * 86_400_000));
    expect(result).not.toMatch(/ago$/);
    expect(result).toMatch(/\d/);
  });
});
