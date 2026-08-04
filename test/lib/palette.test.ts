import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  PALETTE_META,
  paletteColor,
  paletteTint,
  type Tint,
} from "@/lib/palette";
import { PALETTE_CHOICES } from "@/lib/icon-set";
import { REPO_ROOT, sourceFiles, stripComments } from "../helpers";

const TINTS: Tint[] = ["wash", "veil", "chip", "edge", "glow"];
const ROOT = REPO_ROOT;

describe("paletteColor", () => {
  it("returns a bare custom-property reference for every palette", () => {
    for (const key of PALETTE_CHOICES) {
      expect(paletteColor(key)).toBe(`var(--palette-${key})`);
    }
  });

  it("falls back to the neutral colour for an object with no room", () => {
    expect(paletteColor(null)).toBe("var(--palace-muted)");
    expect(paletteColor(undefined)).toBe("var(--palace-muted)");
  });

  it("references a variable that globals.css actually declares", () => {
    const css = readFileSync(join(ROOT, "app", "globals.css"), "utf8");
    for (const key of PALETTE_CHOICES) {
      expect(css).toMatch(new RegExp(`--palette-${key}\\s*:`));
    }
    expect(css).toMatch(/--palace-muted\s*:/);
  });
});

describe("paletteTint", () => {
  it("produces a valid color-mix for every palette and tint", () => {
    for (const key of PALETTE_CHOICES) {
      for (const tint of TINTS) {
        expect(paletteTint(key, tint)).toBe(
          `color-mix(in srgb, var(--palette-${key}) ${
            { wash: "8%", veil: "12%", chip: "14%", edge: "33%", glow: "40%" }[
              tint
            ]
          }, transparent)`,
        );
      }
    }
  });

  it("scales monotonically from wash to glow", () => {
    const alpha = (tint: Tint) =>
      Number(/ (\d+)%/.exec(paletteTint("brass", tint))![1]);
    const values = TINTS.map(alpha);
    expect(values).toEqual([...values].sort((a, b) => a - b));
  });

  it("tints the neutral colour for unfiled objects", () => {
    expect(paletteTint(null, "chip")).toContain("var(--palace-muted)");
  });
});

describe("palette metadata", () => {
  it("has a label for every palette choice", () => {
    for (const key of PALETTE_CHOICES) {
      expect(PALETTE_META[key].label).toBeTruthy();
    }
  });
});

describe("no colour value is built by string concatenation", () => {
  /**
   * Guards the defect this module was rewritten to remove: appending a hex
   * alpha to a `var()` reference produces CSS that is invalid at
   * computed-value time and silently renders as transparent.
   */
  it("never appends characters to a var() reference", () => {
    const offenders: string[] = [];
    for (const dir of ["app", "components", "lib"]) {
      for (const file of sourceFiles(join(ROOT, dir))) {
        const source = stripComments(readFileSync(file, "utf8"));
        // `var(--anything)` immediately followed by a hex digit or a %.
        const match = /var\(--[a-z0-9-]+\)[0-9a-fA-F%]/.exec(source);
        if (match) offenders.push(`${file}: ${match[0]}`);
        // Template interpolation of a colour with a suffix, e.g. `${color}22`.
        const interpolated =
          /\$\{[^}]*(?:color|accent|palette)[^}]*\}[0-9a-fA-F]{2}/i.exec(
            source,
          );
        if (interpolated) offenders.push(`${file}: ${interpolated[0]}`);
      }
    }
    expect(offenders).toEqual([]);
  });
});
