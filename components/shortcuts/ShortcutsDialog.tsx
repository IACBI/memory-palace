"use client";

import { Dialog } from "@/components/ui/Dialog";
import { ShortcutList } from "@/components/shortcuts/ShortcutList";
import { useShortcutsStore } from "@/lib/shortcuts-store";

/**
 * The `?` cheatsheet.
 *
 * The `?` key listener lives in `components/shell/Overlays.tsx` so this whole
 * dialog — and the shortcut table with it — can be code-split behind the first
 * press. Closing goes through the shared overlay stack, so `?` on top of
 * another dialog stacks and unwinds in the order it was opened.
 */
export function ShortcutsDialog() {
  const setOpen = useShortcutsStore((state) => state.setShortcutsOpen);

  return (
    <Dialog
      open
      onClose={() => setOpen(false)}
      title="Keyboard shortcuts"
      description="Press ? at any time to bring this back."
      size="lg"
    >
      <ShortcutList />
    </Dialog>
  );
}
