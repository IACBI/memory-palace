"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export interface Size {
  width: number;
  height: number;
}

export interface MeasuredElement<T extends HTMLElement> {
  /** The observed pixel size, `{0, 0}` until the element exists. */
  size: Size;
  /** Attach to the element to measure. */
  ref: (node: T | null) => void;
  /** The element itself, as state, so effects can depend on it. */
  node: T | null;
}

/**
 * Observes an element's pixel size.
 *
 * A callback ref rather than a `RefObject`: the room canvas only enters the
 * tree once the palace has hydrated, and an effect keyed on a ref object runs
 * exactly once — before the element exists — so it observed nothing and the
 * connection layer silently rendered at zero size.
 */
export function useElementSize<T extends HTMLElement>(): MeasuredElement<T> {
  const [size, setSize] = useState<Size>({ width: 0, height: 0 });
  const [node, setNode] = useState<T | null>(null);
  const observerRef = useRef<ResizeObserver | null>(null);

  const ref = useCallback((next: T | null) => {
    observerRef.current?.disconnect();
    observerRef.current = null;
    setNode(next);

    if (!next || typeof ResizeObserver === "undefined") {
      setSize({ width: 0, height: 0 });
      return;
    }

    const observer = new ResizeObserver(([entry]) => {
      const box = entry.contentRect;
      setSize((current) =>
        current.width === box.width && current.height === box.height
          ? current
          : { width: box.width, height: box.height },
      );
    });
    observer.observe(next);
    observerRef.current = observer;
  }, []);

  useEffect(() => () => observerRef.current?.disconnect(), []);

  return { size, ref, node };
}
