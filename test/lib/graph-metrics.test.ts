import { describe, expect, it } from "vitest";
import {
  collisionRadius,
  hubCount,
  hubIds,
  nodeRadius,
} from "@/lib/graph-metrics";

describe("nodeRadius", () => {
  it("grows with degree", () => {
    expect(nodeRadius(1)).toBeGreaterThan(nodeRadius(0));
    expect(nodeRadius(9)).toBeGreaterThan(nodeRadius(4));
  });

  it("scales area with degree, not radius", () => {
    // Four times the connections should read as four times the ink, which
    // means twice the radius above the base — not four times.
    const area = (degree: number) => (nodeRadius(degree) - nodeRadius(0)) ** 2;
    expect(area(4) / area(1)).toBeCloseTo(4, 5);
  });

  it("keeps a hub from swallowing the canvas", () => {
    // The old linear scale put a twelve-connection node at 30px.
    expect(nodeRadius(12)).toBeLessThan(20);
  });

  it("survives a negative degree rather than returning NaN", () => {
    expect(nodeRadius(-1)).toBe(nodeRadius(0));
  });
});

describe("collisionRadius", () => {
  it("always leaves room around the drawn circle", () => {
    for (const degree of [0, 1, 5, 20]) {
      expect(collisionRadius(degree)).toBeGreaterThan(nodeRadius(degree));
    }
  });
});

describe("hubIds", () => {
  const nodes = [
    { id: "a", degree: 1 },
    { id: "b", degree: 5 },
    { id: "c", degree: 3 },
    { id: "d", degree: 0 },
  ];

  it("picks the most connected", () => {
    expect(hubIds(nodes, 2)).toEqual(new Set(["b", "c"]));
  });

  it("never names an unconnected node", () => {
    expect(hubIds(nodes, 10).has("d")).toBe(false);
  });

  it("breaks ties deterministically, so labels do not flicker", () => {
    const tied = [
      { id: "z", degree: 2 },
      { id: "a", degree: 2 },
    ];
    expect(hubIds(tied, 1)).toEqual(new Set(["a"]));
    expect(hubIds([...tied].reverse(), 1)).toEqual(new Set(["a"]));
  });

  it("names nothing when asked for nothing", () => {
    expect(hubIds(nodes, 0).size).toBe(0);
  });
});

describe("hubCount", () => {
  it("names nothing in a graph small enough to read whole", () => {
    expect(hubCount(6)).toBe(0);
  });

  it("grows with the graph but stays bounded", () => {
    expect(hubCount(20)).toBeGreaterThan(0);
    expect(hubCount(500)).toBeLessThanOrEqual(6);
  });
});
