"use client";

import { usePalaceStore } from "@/lib/store";
import type { HydrationState } from "@/lib/store";

/**
 * Whether the palace document is in memory yet.
 *
 * Screens render a skeleton until this is true, both on the server (where
 * storage does not exist) and during the brief client read. Returning `false`
 * on the server is what keeps the markup identical across hydration.
 */
export function useHydrated(): boolean {
  return usePalaceStore((state) => state.hydrationState === "ready");
}

/** The full lifecycle state, for screens that distinguish first run or error. */
export function useHydrationState(): HydrationState {
  return usePalaceStore((state) => state.hydrationState);
}
