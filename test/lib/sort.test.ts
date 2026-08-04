import { describe, expect, it } from "vitest";
import { byCreatedDesc, byTitle, byUpdatedDesc, pinnedFirst } from "@/lib/sort";
import { makeObject } from "../factories";

const older = makeObject({
  title: "Beta",
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-02T00:00:00.000Z",
});
const newer = makeObject({
  title: "Alpha",
  createdAt: "2026-03-01T00:00:00.000Z",
  updatedAt: "2026-06-01T00:00:00.000Z",
});

describe("byUpdatedDesc", () => {
  it("puts the most recently edited first", () => {
    expect([older, newer].sort(byUpdatedDesc)[0]).toBe(newer);
  });
});

describe("byCreatedDesc", () => {
  it("puts the most recently added first", () => {
    expect([older, newer].sort(byCreatedDesc)[0]).toBe(newer);
  });
});

describe("byTitle", () => {
  it("sorts alphabetically", () => {
    expect([older, newer].sort(byTitle).map((o) => o.title)).toEqual([
      "Alpha",
      "Beta",
    ]);
  });
});

describe("malformed timestamps", () => {
  /**
   * A comparator returning NaN makes the *whole* sort order
   * implementation-defined, not just the bad row — and imported palaces can
   * carry any string at all in a date field.
   */
  it("never returns NaN", () => {
    const broken = makeObject({ createdAt: "not a date", updatedAt: "" });
    for (const compare of [byUpdatedDesc, byCreatedDesc]) {
      expect(compare(broken, newer)).not.toBeNaN();
      expect(compare(newer, broken)).not.toBeNaN();
      expect(compare(broken, broken)).toBe(0);
    }
  });

  it("sorts a broken date last rather than scrambling the list", () => {
    const broken = makeObject({ title: "Broken", updatedAt: "nonsense" });
    const sorted = [broken, older, newer].sort(byUpdatedDesc);
    expect(sorted[sorted.length - 1]).toBe(broken);
  });
});

describe("pinnedFirst", () => {
  const pinned = makeObject({
    title: "Zulu",
    pinned: true,
    updatedAt: "2020-01-01T00:00:00.000Z",
  });

  it("lifts pinned items above the underlying order", () => {
    expect([newer, pinned].sort(pinnedFirst(byUpdatedDesc))[0]).toBe(pinned);
  });

  it("keeps the underlying order within each group", () => {
    const alsoPinned = makeObject({ pinned: true, ...{} });
    const sorted = [older, pinned, alsoPinned, newer].sort(
      pinnedFirst(byUpdatedDesc),
    );
    expect(sorted.slice(0, 2).every((o) => o.pinned)).toBe(true);
    expect(sorted[2]).toBe(newer);
  });
});
