"use client";

import { useCallback, useRef } from "react";

export type Orientation = "horizontal" | "vertical" | "both";

export interface RovingItemProps {
  tabIndex: 0 | -1;
  ref: (node: HTMLElement | null) => void;
  onKeyDown: (event: React.KeyboardEvent) => void;
}

/**
 * Arrow-key navigation across a group of controls, with a single tab stop.
 *
 * A radiogroup or menu whose every option is independently tabbable makes a
 * keyboard user press Tab once per option to get past it, and gives them no
 * way to move between options — which is what the settings radiogroups and the
 * room context menu did.
 *
 * @param count Number of items in the group.
 * @param activeIndex The item that currently owns the tab stop.
 * @param onActivate Called with the index the user moved to.
 */
export function useRovingTabIndex(
  count: number,
  activeIndex: number,
  onActivate: (index: number) => void,
  options: { orientation?: Orientation; loop?: boolean } = {},
): (index: number) => RovingItemProps {
  const { orientation = "both", loop = true } = options;
  const itemsRef = useRef<(HTMLElement | null)[]>([]);

  const move = useCallback(
    (to: number) => {
      if (count === 0) return;
      const index = loop
        ? ((to % count) + count) % count
        : Math.min(count - 1, Math.max(0, to));
      onActivate(index);
      itemsRef.current[index]?.focus();
    },
    [count, loop, onActivate],
  );

  return useCallback(
    (index: number): RovingItemProps => ({
      tabIndex: index === activeIndex ? 0 : -1,
      ref: (node) => {
        itemsRef.current[index] = node;
      },
      onKeyDown: (event) => {
        const forward =
          (orientation !== "vertical" && event.key === "ArrowRight") ||
          (orientation !== "horizontal" && event.key === "ArrowDown");
        const backward =
          (orientation !== "vertical" && event.key === "ArrowLeft") ||
          (orientation !== "horizontal" && event.key === "ArrowUp");

        if (forward) {
          event.preventDefault();
          move(index + 1);
        } else if (backward) {
          event.preventDefault();
          move(index - 1);
        } else if (event.key === "Home") {
          event.preventDefault();
          move(0);
        } else if (event.key === "End") {
          event.preventDefault();
          move(count - 1);
        }
      },
    }),
    [activeIndex, count, move, orientation],
  );
}
