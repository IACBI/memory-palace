import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { ACCENT_KEYS, PALETTE_KEYS } from "@/lib/types";
import { REPO_ROOT } from "../helpers";

/**
 * Contrast is checked against the stylesheet itself, in both themes.
 *
 * The alternative — eyeballing a light theme and shipping it — is how a
 * perfectly pleasant-looking palette turns out to fail on the one pairing
 * nobody thought to look at.
 */

const CSS = readFileSync(join(REPO_ROOT, "app", "globals.css"), "utf8");

type Rgb = [number, number, number];

function parseColour(value: string): Rgb | null {
  const hex = /^#([0-9a-f]{6})$/i.exec(value.trim());
  if (hex) {
    const n = parseInt(hex[1], 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  const rgba = /^rgba?\(([^)]+)\)$/i.exec(value.trim());
  if (rgba) {
    const parts = rgba[1].split(",").map((part) => Number(part.trim()));
    if (parts.length < 3 || parts.some(Number.isNaN)) return null;
    return [parts[0], parts[1], parts[2]];
  }
  return null;
}

/** Alpha of an `rgba()` value; 1 for anything opaque. */
function parseAlpha(value: string): number {
  const rgba = /^rgba\(([^)]+)\)$/i.exec(value.trim());
  if (!rgba) return 1;
  const parts = rgba[1].split(",");
  return parts.length === 4 ? Number(parts[3].trim()) : 1;
}

/** Composites a translucent colour over an opaque one. */
function over(top: Rgb, alpha: number, bottom: Rgb): Rgb {
  return [0, 1, 2].map((i) =>
    Math.round(top[i] * alpha + bottom[i] * (1 - alpha)),
  ) as Rgb;
}

function relativeLuminance([r, g, b]: Rgb): number {
  const channel = (value: number) => {
    const c = value / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

function contrast(a: Rgb, b: Rgb): number {
  const [light, dark] = [relativeLuminance(a), relativeLuminance(b)].sort(
    (x, y) => y - x,
  );
  return (light + 0.05) / (dark + 0.05);
}

/**
 * Reads the custom properties declared in one selector block.
 *
 * A deliberately small parser rather than a CSS library: it only has to
 * understand the handful of `--name: value;` lines this stylesheet writes, and
 * a dependency here would be a dependency in the thing doing the verifying.
 */
function tokensIn(selector: string): Record<string, string> {
  const start = CSS.indexOf(`${selector} {`);
  if (start === -1) throw new Error(`No block for ${selector}`);
  const end = CSS.indexOf("}", start);
  const block = CSS.slice(start, end);

  const tokens: Record<string, string> = {};
  for (const [, name, value] of block.matchAll(
    /(--[a-z0-9-]+)\s*:\s*([^;]+);/gi,
  )) {
    tokens[name] = value.trim();
  }
  return tokens;
}

interface Theme {
  name: string;
  tokens: Record<string, string>;
}

const PALACE: Theme = { name: "palace", tokens: tokensIn(":root") };
const PARCHMENT: Theme = {
  name: "parchment",
  tokens: { ...PALACE.tokens, ...tokensIn(':root[data-theme="parchment"]') },
};
const THEMES = [PALACE, PARCHMENT];

/** Resolves a token to an opaque colour, compositing over `base` if needed. */
function colour(theme: Theme, name: string, base: Rgb): Rgb {
  const raw = theme.tokens[name];
  expect(raw, `${theme.name} declares ${name}`).toBeTruthy();
  const parsed = parseColour(raw);
  expect(parsed, `${name} = "${raw}" is a colour`).not.toBeNull();
  return over(parsed!, parseAlpha(raw), base);
}

describe.each(THEMES)("$name theme", (theme) => {
  const base = colour(theme, "--palace-base", [0, 0, 0]);
  const surface = colour(theme, "--palace-surface", base);
  const surface2 = colour(theme, "--palace-surface-2", base);

  it("carries body text at AA on every surface", () => {
    const text = colour(theme, "--palace-text", surface);
    for (const [label, ground] of [
      ["base", base],
      ["surface", surface],
      ["surface-2", surface2],
    ] as const) {
      expect(contrast(text, ground), `text on ${label}`).toBeGreaterThanOrEqual(
        4.5,
      );
    }
  });

  it("carries secondary text at AA", () => {
    // Muted text is real content — timestamps, room names, counts — not
    // decoration, so it gets the same 4.5:1 as anything else.
    const muted = colour(theme, "--palace-muted", surface);
    expect(contrast(muted, base)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(muted, surface)).toBeGreaterThanOrEqual(4.5);
  });

  it("carries a button label on every accent", () => {
    const onAccent = colour(theme, "--palace-on-accent", surface);
    for (const accent of ACCENT_KEYS) {
      const block =
        accent === "brass"
          ? theme.tokens
          : {
              ...theme.tokens,
              ...tokensIn(
                theme.name === "parchment"
                  ? `:root[data-theme="parchment"][data-accent="${accent}"]`
                  : `:root[data-accent="${accent}"]`,
              ),
            };
      for (const state of ["--palace-accent", "--palace-accent-hover"]) {
        const fill = colour({ ...theme, tokens: block }, state, surface);
        expect(
          contrast(onAccent, fill),
          `${accent} ${state} in ${theme.name}`,
        ).toBeGreaterThanOrEqual(4.5);
      }
    }
  });

  it("gives form controls a 3:1 boundary", () => {
    // WCAG 1.4.11. The decorative hairlines are exempt; the visible edge of an
    // input is not.
    const border = colour(theme, "--palace-border-control", surface);
    expect(contrast(border, surface)).toBeGreaterThanOrEqual(3);
  });

  it("shows every room palette against the surfaces it sits on", () => {
    // Palette colours carry icon glyphs and card edges — non-text UI, so 3:1.
    // Checked against all three grounds: `surface-2` is the lightest in the
    // dark theme and therefore the one a swatch is closest to.
    for (const key of PALETTE_KEYS) {
      const swatch = colour(theme, `--palette-${key}`, surface);
      for (const [label, ground] of [
        ["base", base],
        ["surface", surface],
        ["surface-2", surface2],
      ] as const) {
        expect(
          contrast(swatch, ground),
          `${key} on ${label}`,
        ).toBeGreaterThanOrEqual(3);
      }
    }
  });

  it("keeps destructive text legible", () => {
    const danger = colour(theme, "--palace-danger", surface);
    expect(contrast(danger, surface)).toBeGreaterThanOrEqual(4.5);
  });
});

describe("theme completeness", () => {
  it("parchment redefines every colour token the palace theme declares", () => {
    const parchment = tokensIn(':root[data-theme="parchment"]');
    const missing = Object.keys(PALACE.tokens).filter(
      (name) =>
        (name.startsWith("--palace-") || name.startsWith("--palette-")) &&
        !(name in parchment),
    );
    // A token left behind inherits a value tuned for near-black, which is how
    // one stray dark-on-dark element ends up invisible on paper.
    expect(missing).toEqual([]);
  });
});
