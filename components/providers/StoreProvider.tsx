"use client";

import { useEffect } from "react";
import { usePalaceStore } from "@/lib/store";
import {
  applyDisplayPrefs,
  toDisplayPrefs,
  writeDisplayPrefs,
} from "@/lib/prefs";

/**
 * Starts hydration and keeps display preferences mirrored to `<html>`.
 *
 * Deliberately renders `children` unconditionally. Gating the whole tree
 * behind a spinner meant every route's static HTML contained nothing but
 * "Opening the palace…" — no content to paint, nothing to index, and no
 * chance for a route to describe itself. Screens now render their own
 * skeletons while `hydrationState` is `loading`.
 */
export function StoreProvider({ children }: { children: React.ReactNode }) {
  const hydrate = usePalaceStore((state) => state.hydrate);
  const settings = usePalaceStore((state) => state.settings);
  const hydrationState = usePalaceStore((state) => state.hydrationState);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  useEffect(() => {
    // Before hydration the inline <head> script owns these attributes; writing
    // defaults over it here would cause the flash it exists to prevent.
    if (hydrationState === "loading") return;
    const prefs = toDisplayPrefs(settings);
    applyDisplayPrefs(prefs);
    writeDisplayPrefs(prefs);

    // On `auto`, the system can change theme while the app is open — at
    // sunset, on most desktops. Without this the palace stays as it was until
    // the next reload.
    if (settings.theme !== "auto" || !window.matchMedia) return;
    const query = window.matchMedia("(prefers-color-scheme: light)");
    const reapply = () => applyDisplayPrefs(prefs);
    query.addEventListener("change", reapply);
    return () => query.removeEventListener("change", reapply);
  }, [settings, hydrationState]);

  return <>{children}</>;
}
