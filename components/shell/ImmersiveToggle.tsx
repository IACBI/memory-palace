"use client";

import { useEffect } from "react";
import { Maximize2, Minimize2 } from "lucide-react";
import { useImmersive } from "@/lib/immersive";
import { useDismissable } from "@/lib/hooks/use-dismissable";
import { isEditingText } from "@/lib/shortcuts";
import { IconButton } from "@/components/ui/IconButton";

/**
 * Sends a canvas route fullscreen, and the only thing that offers to.
 *
 * Mounted by the graph, a room and the floor plan — the three screens whose
 * content is a place rather than a document, and the only ones where hiding
 * the navigation leaves something worth looking at.
 *
 * Escape goes through `lib/overlay-stack.ts` like every other dismissal, so a
 * dialog opened on top of the canvas still gets the first press. That stack
 * listens in the capture phase, which is also why the graph's own Escape
 * binding does not need to know this exists: while fullscreen is on, Escape
 * leaves fullscreen, and everything below sees the key again once it is off.
 */
export function ImmersiveToggle({ className }: { className?: string }) {
  const { immersive, toggle, exit } = useImmersive();

  useDismissable(immersive, exit);

  // `F` is scoped to these routes by this component's own lifetime — there is
  // no canvas mounted anywhere else for it to surprise.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey || event.altKey) return;
      if (event.key.toLowerCase() !== "f" || isEditingText(event.target))
        return;
      event.preventDefault();
      toggle();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [toggle]);

  return (
    <IconButton
      label={immersive ? "Leave fullscreen" : "Fill the screen"}
      aria-pressed={immersive}
      onClick={toggle}
      className={className}
    >
      {immersive ? (
        <Minimize2 size={14} strokeWidth={1.75} aria-hidden />
      ) : (
        <Maximize2 size={14} strokeWidth={1.75} aria-hidden />
      )}
    </IconButton>
  );
}
