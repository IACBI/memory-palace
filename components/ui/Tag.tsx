"use client";

import { X } from "lucide-react";
import { paletteTint } from "@/lib/palette";
import type { PaletteKey } from "@/lib/types";

/** A small palette-aware pill, optionally removable. */
export function Tag({
  children,
  palette,
  onRemove,
}: {
  children: React.ReactNode;
  /** Tints the pill to a room's colour. Neutral when omitted. */
  palette?: PaletteKey;
  onRemove?: () => void;
}) {
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full border py-0.5 pr-1 pl-2.5 text-2xs text-text"
      style={{
        borderColor: palette
          ? paletteTint(palette, "edge")
          : "var(--palace-border)",
        backgroundColor: palette
          ? paletteTint(palette, "veil")
          : "var(--palace-surface-2)",
      }}
    >
      <span className="truncate">{children}</span>
      {onRemove ? (
        // 24px, meeting WCAG 2.5.8. Not the 44px the standalone controls get:
        // tags wrap inline at an 8px gap, so a 44px target would overlap its
        // neighbours and start swallowing their clicks. 2.5.8 exempts inline
        // targets for exactly this reason.
        <button
          type="button"
          onClick={onRemove}
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-muted transition-quiet hover:bg-surface hover:text-text"
          aria-label="Remove tag"
        >
          <X size={12} strokeWidth={2} />
        </button>
      ) : (
        <span className="w-1" aria-hidden />
      )}
    </span>
  );
}
