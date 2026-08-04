"use client";

import { useEffect } from "react";
import { Dialog } from "@/components/ui/Dialog";
import { ShortcutList } from "@/components/shortcuts/ShortcutList";
import { isEditingText, isHelpKey } from "@/lib/shortcuts";
import { useShortcutsStore } from "@/lib/shortcuts-store";

/**
 * The `?` cheatsheet.
 *
 * Mounted once by the shell. Closing goes through the shared overlay stack, so
 * `?` on top of another dialog stacks and unwinds in the order it was opened.
 */
export function ShortcutsDialog() {
  const open = useShortcutsStore((state) => state.open);
  const setOpen = useShortcutsStore((state) => state.setShortcutsOpen);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!isHelpKey(event) || isEditingText(event.target)) return;
      event.preventDefault();
      useShortcutsStore.getState().toggleShortcuts();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <Dialog
      open={open}
      onClose={() => setOpen(false)}
      title="Keyboard shortcuts"
      description="Press ? at any time to bring this back."
      size="lg"
    >
      <ShortcutList />
    </Dialog>
  );
}
