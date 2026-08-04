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
      className="group flex w-full max-w-md items-center gap-3 rounded-lg border border-border-hair bg-surface px-3.5 py-2 text-left text-sm text-muted transition-colors hover:border-border-strong hover:text-text"
    >
      <Search size={16} strokeWidth={1.75} className="shrink-0" />
      <span className="flex-1 truncate">Search the palace…</span>
      <kbd className="hidden rounded border border-border-strong bg-surface-2 px-1.5 py-0.5 font-sans text-[11px] tracking-widest text-muted sm:inline">
        Ctrl K
      </kbd>
    </button>
  );
}
