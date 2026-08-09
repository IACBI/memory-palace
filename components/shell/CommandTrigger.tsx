"use client";

import { Search } from "lucide-react";
import { usePalaceStore } from "@/lib/store";

/** The top-bar button that opens the command palette. */
export function CommandTrigger() {
  const setCommandPaletteOpen = usePalaceStore(
    (state) => state.setCommandPaletteOpen,
  );

  return (
    <button
      type="button"
      onClick={() => setCommandPaletteOpen(true)}
      className="flex h-11 w-full max-w-md items-center gap-3 rounded-md border border-border-hair bg-surface/70 px-3.5 text-left text-sm text-muted transition-quiet hover:border-accent-dim hover:bg-surface hover:text-text"
    >
      <Search size={16} strokeWidth={1.75} className="shrink-0" aria-hidden />
      <span className="flex-1 truncate">Search the palace…</span>
      <kbd className="tabular hidden rounded-sm border border-border-strong bg-surface-2 px-1.5 py-0.5 font-sans text-2xs tracking-widest text-muted sm:inline">
        Ctrl K
      </kbd>
    </button>
  );
}
