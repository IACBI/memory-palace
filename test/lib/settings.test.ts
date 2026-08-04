import { describe, expect, it } from "vitest";
import { ACCENTS, DEFAULT_SETTINGS, normalizeSettings } from "@/lib/settings";

describe("normalizeSettings", () => {
  it("returns the defaults for null and undefined", () => {
    expect(normalizeSettings(null)).toEqual(DEFAULT_SETTINGS);
    expect(normalizeSettings(undefined)).toEqual(DEFAULT_SETTINGS);
  });

  it("returns the defaults for an empty object", () => {
    expect(normalizeSettings({})).toEqual(DEFAULT_SETTINGS);
  });

  it("keeps every valid accent", () => {
    for (const accent of ACCENTS) {
      expect(normalizeSettings({ accent }).accent).toBe(accent);
    }
  });

  it("falls back to the default accent for an unknown value", () => {
    expect(normalizeSettings({ accent: "chartreuse" as never }).accent).toBe(
      DEFAULT_SETTINGS.accent,
    );
  });

  it("falls back to the default text size for an unknown value", () => {
    expect(normalizeSettings({ textSize: "enormous" as never }).textSize).toBe(
      DEFAULT_SETTINGS.textSize,
    );
  });

  it("only accepts a real boolean for reduceMotion", () => {
    expect(normalizeSettings({ reduceMotion: true }).reduceMotion).toBe(true);
    expect(
      normalizeSettings({ reduceMotion: "true" as never }).reduceMotion,
    ).toBe(false);
  });

  it("keeps an older export that predates accent and textSize importable", () => {
    // Also carries `lastView`, a setting this version no longer has. Dropping
    // an unknown key must not cost the reader the settings they did set.
    const legacy = { reduceMotion: true, lastView: "/palace" };
    expect(normalizeSettings(legacy)).toEqual({
      theme: DEFAULT_SETTINGS.theme,
      accent: DEFAULT_SETTINGS.accent,
      textSize: DEFAULT_SETTINGS.textSize,
      reduceMotion: true,
    });
    expect("lastView" in normalizeSettings(legacy)).toBe(false);
  });

  it("never returns the input object itself", () => {
    const input = { ...DEFAULT_SETTINGS };
    expect(normalizeSettings(input)).not.toBe(input);
  });
});
