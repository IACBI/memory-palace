import { create } from "zustand";

interface ShortcutsState {
  open: boolean;
  setShortcutsOpen: (open: boolean) => void;
  toggleShortcuts: () => void;
}

/**
 * Whether the `?` cheatsheet is showing.
 *
 * Shared state rather than local, so the sidebar's "Shortcuts" affordance and
 * the key itself drive the same dialog — a shortcut nobody can discover by
 * clicking is a shortcut only its author uses.
 */
export const useShortcutsStore = create<ShortcutsState>((set) => ({
  open: false,
  setShortcutsOpen: (open) => set({ open }),
  toggleShortcuts: () => set((state) => ({ open: !state.open })),
}));
