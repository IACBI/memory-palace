import { describe, expect, it } from "vitest";
import {
  linkMidpoint,
  linkPath,
  nearestEdgeDirection,
  stubEnd,
  toPixels,
} from "@/lib/canvas-links";

const SIZE = { width: 800, height: 400 };

describe("toPixels", () => {
  it("maps a percentage position onto the measured canvas", () => {
    expect(toPixels({ x: 50, y: 50 }, SIZE)).toEqual({ x: 400, y: 200 });
    expect(toPixels({ x: 0, y: 100 }, SIZE)).toEqual({ x: 0, y: 400 });
  });
});

describe("linkPath", () => {
  it("starts and ends at the two objects", () => {
    const path = linkPath({ x: 10, y: 20 }, { x: 110, y: 220 });
    expect(path.startsWith("M 10 20 ")).toBe(true);
    expect(path.endsWith(" 110 220")).toBe(true);
  });

  it("bows off the straight line rather than drawing a chord", () => {
    const a = { x: 0, y: 0 };
    const b = { x: 100, y: 0 };
    const straight = linkMidpoint(a, b, 0);
    const bowed = linkMidpoint(a, b);
    expect(straight).toEqual({ x: 50, y: 0 });
    expect(bowed.y).not.toBe(0);
    expect(bowed.x).toBeCloseTo(50);
  });

  it("is stable for identical endpoints instead of producing NaN", () => {
    const path = linkPath({ x: 5, y: 5 }, { x: 5, y: 5 });
    expect(path).not.toContain("NaN");
  });
});

describe("linkMidpoint", () => {
  it("sits on the curve, not on the chord", () => {
    const a = { x: 0, y: 0 };
    const b = { x: 0, y: 100 };
    const mid = linkMidpoint(a, b);
    // Bow is perpendicular, so a vertical link bows sideways.
    expect(mid.y).toBeCloseTo(50);
    expect(Math.abs(mid.x)).toBeGreaterThan(0);
  });
});

describe("nearestEdgeDirection", () => {
  it("points at whichever edge is closest", () => {
    expect(nearestEdgeDirection({ x: 10, y: 200 }, SIZE)).toEqual({
      x: -1,
      y: 0,
    });
    expect(nearestEdgeDirection({ x: 790, y: 200 }, SIZE)).toEqual({
      x: 1,
      y: 0,
    });
    expect(nearestEdgeDirection({ x: 400, y: 5 }, SIZE)).toEqual({
      x: 0,
      y: -1,
    });
    expect(nearestEdgeDirection({ x: 400, y: 395 }, SIZE)).toEqual({
      x: 0,
      y: 1,
    });
  });
});

describe("stubEnd", () => {
  it("extends from the object toward that edge", () => {
    expect(stubEnd({ x: 20, y: 200 }, SIZE, 30)).toEqual({ x: -10, y: 200 });
  });
});
