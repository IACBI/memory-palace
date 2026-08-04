import { afterEach, describe, expect, it, vi } from "vitest";
import {
  overlayDepth,
  pushOverlay,
  resetOverlayStack,
} from "@/lib/overlay-stack";

const pressEscape = () =>
  window.dispatchEvent(
    new KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
  );

afterEach(() => {
  resetOverlayStack();
});

describe("overlay stack", () => {
  it("dismisses only the topmost overlay", () => {
    const outer = vi.fn();
    const inner = vi.fn();
    pushOverlay(outer);
    pushOverlay(inner);

    pressEscape();

    expect(inner).toHaveBeenCalledTimes(1);
    expect(outer).not.toHaveBeenCalled();
  });

  it("falls through to the next overlay once the top one unregisters", () => {
    const outer = vi.fn();
    const inner = vi.fn();
    pushOverlay(outer);
    const closeInner = pushOverlay(inner);

    pressEscape();
    closeInner();
    pressEscape();

    expect(inner).toHaveBeenCalledTimes(1);
    expect(outer).toHaveBeenCalledTimes(1);
  });

  it("tracks depth and unwinds to zero", () => {
    expect(overlayDepth()).toBe(0);
    const a = pushOverlay(vi.fn());
    const b = pushOverlay(vi.fn());
    expect(overlayDepth()).toBe(2);
    b();
    a();
    expect(overlayDepth()).toBe(0);
  });

  it("unregisters out of order without disturbing the rest", () => {
    const outer = vi.fn();
    const inner = vi.fn();
    const closeOuter = pushOverlay(outer);
    pushOverlay(inner);

    closeOuter();
    pressEscape();

    expect(inner).toHaveBeenCalledTimes(1);
    expect(outer).not.toHaveBeenCalled();
    expect(overlayDepth()).toBe(1);
  });

  it("ignores keys other than Escape", () => {
    const handler = vi.fn();
    pushOverlay(handler);
    window.dispatchEvent(
      new KeyboardEvent("keydown", { key: "Enter", bubbles: true }),
    );
    expect(handler).not.toHaveBeenCalled();
  });

  it("does nothing when no overlay is open", () => {
    expect(() => pressEscape()).not.toThrow();
  });

  it("stops the event so listeners below never see it", () => {
    pushOverlay(vi.fn());
    const below = vi.fn();
    document.addEventListener("keydown", below);
    pressEscape();
    document.removeEventListener("keydown", below);
    expect(below).not.toHaveBeenCalled();
  });
});
