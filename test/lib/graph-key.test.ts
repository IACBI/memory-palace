import { describe, expect, it } from "vitest";
import { graphSignature } from "@/lib/graph-key";
import { makeConnection, makeObject } from "../factories";

describe("graphSignature", () => {
  const a = makeObject({ id: "a" });
  const b = makeObject({ id: "b" });
  const link = makeConnection({ fromId: "a", toId: "b" });

  it("is unchanged by an edit that does not alter the shape", () => {
    const before = graphSignature([a, b], [link]);
    const renamed = { ...a, title: "Something else", updatedAt: "later" };
    expect(graphSignature([renamed, b], [link])).toBe(before);
  });

  it("changes when an object is added", () => {
    const before = graphSignature([a], []);
    expect(graphSignature([a, b], [])).not.toBe(before);
  });

  it("changes when an object is removed", () => {
    const before = graphSignature([a, b], []);
    expect(graphSignature([a], [])).not.toBe(before);
  });

  it("changes when a connection is added", () => {
    const before = graphSignature([a, b], []);
    expect(graphSignature([a, b], [link])).not.toBe(before);
  });

  it("changes when a connection is removed", () => {
    const before = graphSignature([a, b], [link]);
    expect(graphSignature([a, b], [])).not.toBe(before);
  });

  it("distinguishes direction", () => {
    const reversed = makeConnection({ fromId: "b", toId: "a" });
    expect(graphSignature([a, b], [link])).not.toBe(
      graphSignature([a, b], [reversed]),
    );
  });

  it("cannot be confused by ids containing the separators", () => {
    const tricky = makeObject({ id: "a,b" });
    expect(graphSignature([tricky], [])).not.toBe(
      graphSignature([makeObject({ id: "a" }), makeObject({ id: "b" })], []),
    );
  });

  it("is stable for identical input", () => {
    expect(graphSignature([a, b], [link])).toBe(graphSignature([a, b], [link]));
  });
});
