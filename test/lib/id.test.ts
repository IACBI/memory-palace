import { afterEach, describe, expect, it, vi } from "vitest";
import { newId } from "@/lib/id";

const UUID_V4 =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

/** Replaces `globalThis.crypto` with a partial implementation. */
function stubCrypto(value: Partial<Crypto> | undefined) {
  vi.stubGlobal("crypto", value);
}

describe("newId", () => {
  it("returns a v4 uuid", () => {
    expect(newId()).toMatch(UUID_V4);
  });

  it("returns a different value every call", () => {
    const ids = new Set(Array.from({ length: 500 }, () => newId()));
    expect(ids.size).toBe(500);
  });

  it("still works on an insecure origin, where randomUUID is undefined", () => {
    stubCrypto({
      getRandomValues: globalThis.crypto.getRandomValues.bind(
        globalThis.crypto,
      ),
    });
    expect(newId()).toMatch(UUID_V4);
  });

  it("still works when randomUUID exists but throws", () => {
    stubCrypto({
      randomUUID: () => {
        throw new Error("not available in this context");
      },
      getRandomValues: globalThis.crypto.getRandomValues.bind(
        globalThis.crypto,
      ),
    });
    expect(newId()).toMatch(UUID_V4);
  });

  it("still works with no web crypto at all", () => {
    stubCrypto(undefined);
    expect(newId()).toMatch(UUID_V4);
  });

  it("stays unique on the Math.random fallback path", () => {
    stubCrypto(undefined);
    const ids = new Set(Array.from({ length: 500 }, () => newId()));
    expect(ids.size).toBe(500);
  });
});
