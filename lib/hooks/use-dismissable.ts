"use client";

import { useEffect, useRef } from "react";
import { pushOverlay } from "@/lib/overlay-stack";

/**
 * Dismisses an overlay on Escape, but only while it is the topmost one.
 *
 * @param active Whether the overlay is currently open.
 * @param onDismiss Called when Escape reaches this overlay.
 */
export function useDismissable(active: boolean, onDismiss: () => void): void {
  const latest = useRef(onDismiss);

  useEffect(() => {
    latest.current = onDismiss;
  });

  useEffect(() => {
    if (!active) return;
    return pushOverlay(() => latest.current());
  }, [active]);
}
