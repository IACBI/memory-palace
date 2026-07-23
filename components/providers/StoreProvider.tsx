"use client";

import { useEffect } from "react";
import { usePalaceStore } from "@/lib/store";

/**
 * Hydrates the palace store from persistence on mount and gates the app
 * behind a quiet loading state until data is ready.
 */
export function StoreProvider({ children }: { children: React.ReactNode }) {
  const hydrated = usePalaceStore((state) => state.hydrated);
  const hydrate = usePalaceStore((state) => state.hydrate);
  const reduceMotion = usePalaceStore((state) => state.settings.reduceMotion);
  const accent = usePalaceStore((state) => state.settings.accent);
  const textSize = usePalaceStore((state) => state.settings.textSize);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  // Reflect preferences onto <html> so the CSS variable themes take effect.
  useEffect(() => {
    document.documentElement.dataset.reduceMotion = reduceMotion
      ? "true"
      : "false";
  }, [reduceMotion]);

  useEffect(() => {
    document.documentElement.dataset.accent = accent;
  }, [accent]);

  useEffect(() => {
    document.documentElement.dataset.textSize = textSize;
  }, [textSize]);

  if (!hydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-base">
        <div className="flex flex-col items-center gap-4">
          <div
            className="h-8 w-8 animate-spin rounded-full border-2 border-border-strong border-t-accent"
            aria-hidden
          />
          <p className="font-display text-lg tracking-wide text-muted">
            Opening the palace…
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
