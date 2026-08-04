"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const PAGE = 60;

export interface IncrementalList {
  /** How many items to render right now. */
  limit: number;
  /** Attach to a sentinel element after the last rendered item. */
  sentinelRef: (node: HTMLElement | null) => void;
  /** True while more items remain. */
  hasMore: boolean;
}

/**
 * Renders a long list a page at a time, growing as the reader scrolls.
 *
 * The library rendered every matching object at once. That is fine for a
 * demo-sized palace and increasingly not fine as one fills up — a few thousand
 * rows is a few thousand DOM nodes built during a keystroke in the search box.
 *
 * Uses `IntersectionObserver` rather than a windowing library: it keeps every
 * rendered row in the document, so find-in-page, Tab order and screen-reader
 * navigation all behave normally.
 *
 * @param total Number of items available after filtering.
 * @param resetKey Changes when the list content changes, to page back to the top.
 */
export function useIncrementalList(
  total: number,
  resetKey: unknown,
): IncrementalList {
  const [limit, setLimit] = useState(PAGE);
  const [seenKey, setSeenKey] = useState(resetKey);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Adjust during render rather than in an effect: React re-runs this pass
  // before committing, so the reader never sees a frame of the previous
  // filter's overflowing list.
  if (resetKey !== seenKey) {
    setSeenKey(resetKey);
    setLimit(PAGE);
  }

  const sentinelRef = useCallback((node: HTMLElement | null) => {
    observerRef.current?.disconnect();
    if (!node || typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setLimit((current) => current + PAGE);
        }
      },
      // Start loading before the sentinel is actually on screen.
      { rootMargin: "400px" },
    );
    observer.observe(node);
    observerRef.current = observer;
  }, []);

  useEffect(() => () => observerRef.current?.disconnect(), []);

  return { limit, sentinelRef, hasMore: limit < total };
}
