import type { PaletteKey } from "@/lib/types";

/** Human-readable name for each room palette. */
export const PALETTE_META: Record<PaletteKey, { label: string }> = {
  brass: { label: "Brass" },
  oxblood: { label: "Oxblood" },
  forest: { label: "Forest" },
  ink: { label: "Ink" },
  plum: { label: "Plum" },
  umber: { label: "Umber" },
};

/**
 * The tint scale. Every tinted surface in the app uses one of these steps
 * rather than an ad-hoc opacity, so room colour reads consistently.
 */
export type Tint =
  /** Large fills: a room chamber's background, a room canvas. */
  | "wash"
  /** Small filled pills: tags. */
  | "veil"
  /** Icon chips and badges. */
  | "chip"
  /** Borders on tinted surfaces. */
  | "edge"
  /** Hover glow and drop shadows. */
  | "glow";

const TINT_ALPHA: Record<Tint, string> = {
  wash: "8%",
  veil: "12%",
  chip: "14%",
  edge: "33%",
  glow: "40%",
};

/**
 * The base colour for a room palette, as a CSS value. Pass `null` for objects
 * with no room, which get the neutral "unfiled" colour.
 *
 * This is a `var()` reference, not a hex literal, so an alpha suffix must
 * never be appended to it. Custom-property substitution is token-based:
 * `var(--palette-brass)22` is invalid at computed-value time and silently
 * falls back to the property's initial value — which is why every room tint in
 * this app used to render as fully transparent. Use {@link paletteTint}.
 */
export function paletteColor(key: PaletteKey | null | undefined): string {
  return key ? `var(--palette-${key})` : "var(--palace-muted)";
}

/**
 * A translucent step of a room's palette colour.
 *
 * Derived with `color-mix()` from the same custom property the solid colour
 * uses, so switching theme only has to redefine the six base hexes — no
 * JavaScript is involved in re-tinting.
 */
export function paletteTint(
  key: PaletteKey | null | undefined,
  tint: Tint,
): string {
  return `color-mix(in srgb, ${paletteColor(key)} ${TINT_ALPHA[tint]}, transparent)`;
}
