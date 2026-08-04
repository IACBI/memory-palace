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
      className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] leading-none text-text"
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
        <button
          type="button"
          onClick={onRemove}
          className="-mr-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full text-muted transition-colors hover:text-text"
          aria-label="Remove tag"
        >
          <X size={11} strokeWidth={2} />
        </button>
      ) : null}
    </span>
  );
}
