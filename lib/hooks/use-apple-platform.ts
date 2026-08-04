"use client";

import { useSyncExternalStore } from "react";
import { isApplePlatform } from "@/lib/shortcuts";

/** The platform never changes mid-session, so there is nothing to subscribe to. */
const noop = () => () => {};

/**
 * Whether to label the modifier key `⌘` rather than `Ctrl`.
 *
 * Read through `useSyncExternalStore` so the server and the hydrating client
 * agree on `false`, and the real value lands in the commit right after.
 */
export function useApplePlatform(): boolean {
  return useSyncExternalStore(
    noop,
    () => isApplePlatform(navigator.userAgent),
    () => false,
  );
}
