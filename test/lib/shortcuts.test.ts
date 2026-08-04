import { describe, expect, it } from "vitest";
import {
  MOD,
  SHORTCUT_GROUPS,
  isApplePlatform,
  isEditingText,
  isHelpKey,
  resolveChord,
} from "@/lib/shortcuts";

const CHROME_WINDOWS =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";
const SAFARI_MAC =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15";
const SAFARI_IPAD =
  "Mozilla/5.0 (iPad; CPU OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1";

describe("isApplePlatform", () => {
  it("recognises macOS and iOS", () => {
    expect(isApplePlatform(SAFARI_MAC)).toBe(true);
    expect(isApplePlatform(SAFARI_IPAD)).toBe(true);
  });

  it("does not match Windows, which also reports AppleWebKit", () => {
    expect(isApplePlatform(CHROME_WINDOWS)).toBe(false);
  });
});

describe("resolveChord", () => {
  it("substitutes the platform modifier", () => {
    expect(resolveChord([MOD, "K"], false)).toEqual(["Ctrl", "K"]);
    expect(resolveChord([MOD, "K"], true)).toEqual(["⌘", "K"]);
  });

  it("leaves ordinary keys alone", () => {
    expect(resolveChord(["Enter"], true)).toEqual(["Enter"]);
    expect(resolveChord(["0"], false)).toEqual(["0"]);
  });

  it("does not mutate the source chord", () => {
    const chord = [MOD, "Z"] as const;
    resolveChord(chord, true);
    expect(chord).toEqual([MOD, "Z"]);
  });
});

describe("isHelpKey", () => {
  const event = (over: Partial<Parameters<typeof isHelpKey>[0]>) => ({
    key: "?",
    ctrlKey: false,
    metaKey: false,
    altKey: false,
    ...over,
  });

  it("accepts a bare question mark", () => {
    expect(isHelpKey(event({}))).toBe(true);
  });

  it("accepts it without Shift, for layouts that do not need Shift", () => {
    // The printed character is what matters; on AZERTY `?` is unshifted.
    expect(isHelpKey(event({ key: "?" }))).toBe(true);
  });

  it("ignores combinations owned by the browser or the OS", () => {
    expect(isHelpKey(event({ ctrlKey: true }))).toBe(false);
    expect(isHelpKey(event({ metaKey: true }))).toBe(false);
    expect(isHelpKey(event({ altKey: true }))).toBe(false);
  });

  it("ignores other keys", () => {
    expect(isHelpKey(event({ key: "/" }))).toBe(false);
    expect(isHelpKey(event({ key: "7" }))).toBe(false);
  });
});

describe("isEditingText", () => {
  it("is true for the fields a user types into", () => {
    for (const tag of ["input", "textarea", "select"]) {
      expect(isEditingText(document.createElement(tag))).toBe(true);
    }
  });

  it("is true for contenteditable elements", () => {
    const node = document.createElement("div");
    node.contentEditable = "true";
    // jsdom does not derive `isContentEditable` from the attribute.
    Object.defineProperty(node, "isContentEditable", { value: true });
    expect(isEditingText(node)).toBe(true);
  });

  it("is false for ordinary elements and for no target", () => {
    expect(isEditingText(document.createElement("div"))).toBe(false);
    expect(isEditingText(document.createElement("button"))).toBe(false);
    expect(isEditingText(null)).toBe(false);
  });
});

describe("the shortcut reference", () => {
  const all = SHORTCUT_GROUPS.flatMap((group) =>
    group.shortcuts.map((shortcut) => ({ group, shortcut })),
  );

  it("describes every group exactly once", () => {
    const scopes = SHORTCUT_GROUPS.map((group) => group.scope);
    expect(new Set(scopes).size).toBe(scopes.length);
  });

  it("gives every shortcut a label and at least one chord", () => {
    for (const { shortcut } of all) {
      expect(shortcut.label).toBeTruthy();
      expect(shortcut.chords.length).toBeGreaterThan(0);
      for (const chord of shortcut.chords) {
        expect(chord.length).toBeGreaterThan(0);
        for (const key of chord) expect(key.trim()).toBe(key);
      }
    }
  });

  /**
   * The defect this list was written to fix: arrow keys and Delete were
   * documented as if they worked anywhere, when both need a focused object
   * card. Pressing a shortcut that the app advertises and getting nothing is
   * worse than never seeing it documented.
   */
  it("keeps canvas-only keys out of the global scope", () => {
    const global = SHORTCUT_GROUPS.find((group) => group.scope === "global")!;
    const globalKeys = global.shortcuts.flatMap((shortcut) =>
      shortcut.chords.flat(),
    );
    for (const key of ["←", "↑", "↓", "→", "Delete", "Backspace"]) {
      expect(globalKeys).not.toContain(key);
    }
  });

  it("documents undo and redo, which have no on-screen affordance", () => {
    const global = SHORTCUT_GROUPS.find((group) => group.scope === "global")!;
    const chords = global.shortcuts.map((shortcut) =>
      shortcut.chords[0].join("+"),
    );
    expect(chords).toContain(`${MOD}+Z`);
    expect(chords).toContain(`${MOD}+Shift+Z`);
  });
});
