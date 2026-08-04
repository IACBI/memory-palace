import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  applyDisplayPrefs,
  DEFAULT_PREFS,
  PREFS_BOOTSTRAP_SCRIPT,
  PREFS_KEY,
  toDisplayPrefs,
  writeDisplayPrefs,
} from "@/lib/prefs";
import { DEFAULT_SETTINGS } from "@/lib/settings";

beforeEach(() => {
  window.localStorage.clear();
  const root = document.documentElement;
  delete root.dataset.theme;
  delete root.dataset.accent;
  delete root.dataset.textSize;
  delete root.dataset.reduceMotion;
});

describe("display prefs", () => {
  it("narrows settings down to the three display fields", () => {
    expect(toDisplayPrefs({ ...DEFAULT_SETTINGS })).toEqual({
      theme: DEFAULT_SETTINGS.theme,
      accent: DEFAULT_SETTINGS.accent,
      textSize: DEFAULT_SETTINGS.textSize,
      reduceMotion: DEFAULT_SETTINGS.reduceMotion,
    });
  });

  it("writes the attributes the CSS themes key off", () => {
    applyDisplayPrefs({
      theme: "parchment",
      accent: "sage",
      textSize: "large",
      reduceMotion: true,
    });
    const root = document.documentElement;
    expect(root.dataset.theme).toBe("parchment");
    expect(root.dataset.accent).toBe("sage");
    expect(root.dataset.textSize).toBe("large");
    expect(root.dataset.reduceMotion).toBe("true");
  });

  it("round-trips through the mirror key", () => {
    const prefs = {
      theme: "palace",
      accent: "copper",
      textSize: "small",
      reduceMotion: false,
    } as const;
    writeDisplayPrefs(prefs);
    expect(JSON.parse(window.localStorage.getItem(PREFS_KEY)!)).toEqual(prefs);
  });

  it("keeps the mirror small — the bootstrap script parses it before paint", () => {
    writeDisplayPrefs(DEFAULT_PREFS);
    expect(window.localStorage.getItem(PREFS_KEY)!.length).toBeLessThan(128);
  });
});

describe("bootstrap script", () => {
  /** Runs the inline script the way the browser would. */
  const run = () => new Function(PREFS_BOOTSTRAP_SCRIPT)();

  /** jsdom implements no `matchMedia`, so the media query is stubbed in. */
  const stubMatchMedia = (light: boolean) => {
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      writable: true,
      value: (query: string) => ({ matches: light && query.includes("light") }),
    });
  };

  afterEach(() => {
    Reflect.deleteProperty(window, "matchMedia");
  });

  it("applies saved preferences", () => {
    writeDisplayPrefs({
      theme: "parchment",
      accent: "slate",
      textSize: "large",
      reduceMotion: true,
    });
    run();

    const root = document.documentElement;
    expect(root.dataset.theme).toBe("parchment");
    expect(root.dataset.accent).toBe("slate");
    expect(root.dataset.textSize).toBe("large");
    expect(root.dataset.reduceMotion).toBe("true");
  });

  it("falls back to defaults when nothing is stored", () => {
    run();
    const root = document.documentElement;
    expect(root.dataset.theme).toBe(DEFAULT_PREFS.theme);
    expect(root.dataset.accent).toBe(DEFAULT_PREFS.accent);
    expect(root.dataset.textSize).toBe(DEFAULT_PREFS.textSize);
    expect(root.dataset.reduceMotion).toBe("false");
  });

  it("survives a corrupt mirror rather than blocking the paint", () => {
    window.localStorage.setItem(PREFS_KEY, "{not json");
    expect(() => run()).not.toThrow();
    expect(document.documentElement.dataset.accent).toBe(DEFAULT_PREFS.accent);
  });

  it("resolves an auto theme against the system preference", () => {
    // The stylesheet only knows `palace` and `parchment`; `auto` must never
    // reach the element or every token would need writing twice.
    stubMatchMedia(true);
    writeDisplayPrefs({ ...DEFAULT_PREFS, theme: "auto" });
    run();
    expect(document.documentElement.dataset.theme).toBe("parchment");

    stubMatchMedia(false);
    run();
    expect(document.documentElement.dataset.theme).toBe("palace");
  });

  it("still applies the other preferences without matchMedia", () => {
    // jsdom has no `matchMedia`, and neither do some embedded browsers. The
    // theme lookup throwing must not cost the reader their accent too.
    writeDisplayPrefs({ ...DEFAULT_PREFS, theme: "auto", accent: "sage" });
    expect(() => run()).not.toThrow();

    const root = document.documentElement;
    expect(root.dataset.theme).toBe("palace");
    expect(root.dataset.accent).toBe("sage");
  });

  it("is a single self-contained expression", () => {
    expect(PREFS_BOOTSTRAP_SCRIPT).not.toContain("\n");
    expect(PREFS_BOOTSTRAP_SCRIPT.startsWith("(function()")).toBe(true);
  });
});
