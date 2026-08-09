"use client";

/**
 * Fullscreen mode for the three canvas routes.
 *
 * Held as an attribute on the document element rather than in the palace
 * store, for two reasons. The first is that `AppShell` is a Server Component
 * and has to stay one, so the thing that hides its header and sidebar cannot
 * be a React value it subscribes to — the same reason `data-theme` and
 * `data-reduce-motion` live on the root. The second is that this is not part
 * of the palace: it must never be written to storage, and it must never enter
 * the undo history.
 *
 * `app/globals.css` does the rest, including zeroing `--shell-header` so
 * `CanvasStage` grows to the whole window without any JavaScript in the resize
 * path.
 */

import { useCallback, useEffect, useSyncExternalStore } from "react";

let immersive = false;

/** Notified on every write; nothing else can change this. */
const listeners = new Set<() => void>();

function subscribe(onChange: () => void): () => void {
  listeners.add(onChange);
  return () => {
    listeners.delete(onChange);
  };
}

function snapshot(): boolean {
  return immersive;
}

/** The server has no document, and always renders the chrome. */
function serverSnapshot(): boolean {
  return false;
}

export function setImmersive(next: boolean): void {
  if (immersive === next) return;
  immersive = next;

  if (typeof document !== "undefined") {
    if (next) document.documentElement.dataset.immersive = "true";
    else delete document.documentElement.dataset.immersive;
  }

  for (const listener of listeners) listener();
}

export interface ImmersiveControls {
  immersive: boolean;
  toggle: () => void;
  exit: () => void;
}

/**
 * Reads and drives fullscreen mode.
 *
 * Leaving the canvas leaves the mode: the caller unmounting is the reader
 * navigating away, and landing on the library with no sidebar and no top bar
 * would be a dead end with nothing on screen explaining it.
 */
export function useImmersive(): ImmersiveControls {
  const value = useSyncExternalStore(subscribe, snapshot, serverSnapshot);

  useEffect(() => () => setImmersive(false), []);

  return {
    immersive: value,
    toggle: useCallback(() => setImmersive(!immersive), []),
    exit: useCallback(() => setImmersive(false), []),
  };
}
