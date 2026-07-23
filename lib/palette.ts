import type { PaletteKey } from "@/lib/types";

/** Maps each room palette to its CSS accent variable and a friendly label. */
export const PALETTE_META: Record<PaletteKey, { color: string; label: string }> = {
  brass: { color: "var(--palette-brass)", label: "Brass" },
  oxblood: { color: "var(--palette-oxblood)", label: "Oxblood" },
  forest: { color: "var(--palette-forest)", label: "Forest" },
  ink: { color: "var(--palette-ink)", label: "Ink" },
  plum: { color: "var(--palette-plum)", label: "Plum" },
  umber: { color: "var(--palette-umber)", label: "Umber" },
};

/** Returns the CSS color value for a room palette. */
export function paletteColor(key: PaletteKey): string {
  return PALETTE_META[key].color;
}
