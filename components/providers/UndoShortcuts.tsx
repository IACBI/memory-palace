"use client";

import { useEffect } from "react";
import { usePalaceStore } from "@/lib/store";
import { isEditingText } from "@/lib/shortcuts";
import { toast } from "@/lib/toast-store";

/**
 * Ctrl/Cmd+Z and Ctrl/Cmd+Shift+Z, application-wide.
 *
 * Suppressed while a text field has focus: the browser's own undo is the right
 * behaviour there, and stealing it would make typing feel broken.
 */
export function UndoShortcuts() {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!(event.metaKey || event.ctrlKey)) return;
      if (event.key.toLowerCase() !== "z") return;
      if (isEditingText(event.target)) return;

      event.preventDefault();
      const store = usePalaceStore.getState();

      if (event.shiftKey) {
        const label = store.redo();
        if (label) toast({ message: `Redid: ${label}` });
        return;
      }

      const label = store.undo();
      if (label) {
        toast({
          message: `Undid: ${label}`,
          action: {
            label: "Redo",
            onClick: () => usePalaceStore.getState().redo(),
          },
        });
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return null;
}
