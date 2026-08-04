import { create } from "zustand";
import type { PalaceData } from "@/lib/types";
import type { StorageAdapter } from "@/lib/storage/adapter";
import { isQuotaError, StorageQuotaError } from "@/lib/storage/errors";

const SAVE_DEBOUNCE_MS = 300;

export type SaveStatus = "idle" | "pending" | "saved" | "error";

interface SaveState {
  status: SaveStatus;
  /** Epoch ms of the last successful write, or null if nothing saved yet. */
  lastSavedAt: number | null;
  setStatus: (status: SaveStatus, lastSavedAt?: number) => void;
}

/** Save state, kept separate from the palace document it describes. */
export const useSaveStatus = create<SaveState>((set) => ({
  status: "idle",
  lastSavedAt: null,
  setStatus: (status, lastSavedAt) =>
    set((prev) => ({
      status,
      lastSavedAt: lastSavedAt ?? prev.lastSavedAt,
    })),
}));

export interface Persistence {
  /** Queues a debounced write. Safe to call on every mutation. */
  schedule: () => void;
  /** Cancels any pending write and saves immediately. */
  flush: () => Promise<void>;
  /** Removes the page-lifecycle listeners. Only needed in tests. */
  dispose: () => void;
}

/**
 * Debounced persistence with a guaranteed flush on page hide.
 *
 * A bare debounce loses whatever changed in the last few hundred milliseconds
 * before the tab closes. `pagehide` and `visibilitychange` are used rather than
 * `beforeunload`, which does not fire reliably on mobile Safari or Chrome for
 * Android.
 */
export function createPersistence(
  adapter: StorageAdapter,
  snapshot: () => PalaceData,
): Persistence {
  let timer: ReturnType<typeof setTimeout> | null = null;

  const write = async (): Promise<void> => {
    try {
      await adapter.save(snapshot());
      useSaveStatus.getState().setStatus("saved", Date.now());
    } catch (error) {
      // Never rethrown: writes are fire-and-forget from every mutation, so a
      // throw here would surface as an unhandled rejection with no handler.
      // The status is the channel the UI listens on.
      useSaveStatus.getState().setStatus("error");
      if (!isQuotaError(error)) console.error("Palace save failed", error);
    }
  };

  const flush = async (): Promise<void> => {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
    await write();
  };

  const schedule = (): void => {
    useSaveStatus.getState().setStatus("pending");
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      timer = null;
      void write();
    }, SAVE_DEBOUNCE_MS);
  };

  const flushOnHide = () => {
    if (timer) void flush();
  };
  const flushIfHidden = () => {
    if (document.visibilityState === "hidden") flushOnHide();
  };

  if (typeof window !== "undefined") {
    window.addEventListener("pagehide", flushOnHide);
    // Fired at the document; reaches window because it bubbles.
    window.addEventListener("visibilitychange", flushIfHidden);
  }

  const dispose = (): void => {
    if (typeof window === "undefined") return;
    window.removeEventListener("pagehide", flushOnHide);
    window.removeEventListener("visibilitychange", flushIfHidden);
  };

  return { schedule, flush, dispose };
}

export { StorageQuotaError };
