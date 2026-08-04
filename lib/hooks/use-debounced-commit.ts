"use client";

import { useCallback, useEffect, useRef } from "react";

export interface DebouncedCommit<T> {
  /** Queues a write, replacing any still pending. */
  push: (value: T) => void;
  /** Writes anything pending right now. */
  flush: () => void;
}

/**
 * Batches rapid edits into one write.
 *
 * Typing used to hit the global store on every keystroke: each character
 * replaced the whole objects array, re-rendered every subscriber, and re-armed
 * a serialisation of the entire palace document. Buffering locally and
 * committing on a pause keeps that off the critical path — with a flush on
 * blur and unmount so nothing is ever left unsaved.
 */
export function useDebouncedCommit<T>(
  commit: (value: T) => void,
  delayMs = 400,
): DebouncedCommit<T> {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pending = useRef<{ value: T } | null>(null);
  const latestCommit = useRef(commit);

  useEffect(() => {
    latestCommit.current = commit;
  });

  const flush = useCallback(() => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
    const queued = pending.current;
    if (!queued) return;
    pending.current = null;
    latestCommit.current(queued.value);
  }, []);

  const push = useCallback(
    (value: T) => {
      pending.current = { value };
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => {
        timer.current = null;
        const queued = pending.current;
        if (!queued) return;
        pending.current = null;
        latestCommit.current(queued.value);
      }, delayMs);
    },
    [delayMs],
  );

  // Unmount is the last chance to write; closing the editor must not drop the
  // final keystrokes.
  useEffect(() => flush, [flush]);

  // Nor may closing the tab. Without this, buffering the edit merely moved the
  // data-loss window that the persistence layer's own flush already closes.
  useEffect(() => {
    const onHide = () => flush();
    const onVisibility = () => {
      if (document.visibilityState === "hidden") flush();
    };
    window.addEventListener("pagehide", onHide);
    window.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("pagehide", onHide);
      window.removeEventListener("visibilitychange", onVisibility);
    };
  }, [flush]);

  return { push, flush };
}
