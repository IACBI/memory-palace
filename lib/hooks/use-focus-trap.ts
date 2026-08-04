"use client";

import { useEffect, useRef } from "react";

export const FOCUSABLE_SELECTOR =
  'a[href],button:not([disabled]),textarea:not([disabled]),input:not([disabled]),select:not([disabled]),[tabindex]:not([tabindex="-1"])';

/** Visible focusables, in DOM order. */
function focusableWithin(panel: HTMLElement): HTMLElement[] {
  return Array.from(
    panel.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
  ).filter((el) => el.offsetParent !== null || el === document.activeElement);
}

/**
 * Traps Tab within a panel while `active`, moves focus into it on open, and
 * restores focus to whatever was focused before on close.
 *
 * The listener is attached to the DOM node rather than through JSX so that a
 * container with a non-interactive role (`dialog`) does not need a keyboard
 * handler prop on it.
 *
 * @param active Whether the panel is open.
 * @param options.initialFocus Ref to the element that should receive focus;
 *   defaults to the first focusable descendant.
 * @returns A ref to attach to the panel element.
 */
export function useFocusTrap<T extends HTMLElement>(
  active: boolean,
  options: { initialFocus?: React.RefObject<HTMLElement | null> } = {},
): React.RefObject<T | null> {
  const panelRef = useRef<T>(null);
  const initialFocus = options.initialFocus;

  useEffect(() => {
    if (!active) return;
    const panel = panelRef.current;
    if (!panel) return;

    const previouslyFocused = document.activeElement as HTMLElement | null;
    (initialFocus?.current ?? focusableWithin(panel)[0])?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Tab") return;
      const focusable = focusableWithin(panel);
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;
      if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    };

    panel.addEventListener("keydown", onKeyDown);
    return () => {
      panel.removeEventListener("keydown", onKeyDown);
      previouslyFocused?.focus?.();
    };
  }, [active, initialFocus]);

  return panelRef;
}
