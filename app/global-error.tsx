"use client";

import { useEffect } from "react";
import { PREFS_KEY } from "@/lib/prefs";
import { STORAGE_KEY } from "@/lib/storage/local-storage";

/**
 * The last line of defence: catches errors thrown by the root layout itself,
 * which `app/error.tsx` cannot see. Renders its own `<html>` and `<body>` and
 * cannot rely on the app's stylesheet, so the styling is inline.
 *
 * The colours are the dark theme's `--palace-base`, `-text`, `-muted`,
 * `-accent` and `-on-accent`, copied as literals. They have to be re-copied
 * by hand whenever the palette is re-hued — nothing enforces it, because this
 * file deliberately cannot import the stylesheet it would need to.
 *
 * Offers a data reset because the most likely way to break the root layout in
 * a local-first app is unreadable storage — without it, a corrupt entry would
 * white-screen the app on every visit with no way back.
 */
export default function GlobalError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  const clearAndReload = () => {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
      window.localStorage.removeItem(PREFS_KEY);
    } catch {
      // Nothing else to try; the reload below is still worth attempting.
    }
    window.location.reload();
  };

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#0f0f11",
          color: "#eeeae4",
          fontFamily: "system-ui, sans-serif",
          padding: "2rem",
        }}
      >
        <title>Something broke · Memory Palace</title>
        <main style={{ maxWidth: "32rem", textAlign: "center" }}>
          <h1
            style={{
              fontSize: "2rem",
              fontWeight: 600,
              letterSpacing: "-0.02em",
              margin: 0,
            }}
          >
            The palace didn&apos;t open
          </h1>
          <p
            style={{
              marginTop: "0.75rem",
              fontSize: "0.9rem",
              lineHeight: 1.6,
              color: "#a29b92",
            }}
          >
            Something failed before the app could start. Try again first — if it
            keeps happening, the data saved in this browser is likely unreadable
            and clearing it will get you back in.
          </p>
          <div
            style={{
              marginTop: "1.75rem",
              display: "flex",
              gap: "0.75rem",
              justifyContent: "center",
              flexWrap: "wrap",
            }}
          >
            <button
              type="button"
              onClick={() => unstable_retry()}
              style={{
                minHeight: "2.75rem",
                padding: "0 1.25rem",
                borderRadius: "0.5rem",
                border: "none",
                cursor: "pointer",
                backgroundColor: "#f0b775",
                color: "#17130d",
                font: "500 0.875rem system-ui, sans-serif",
              }}
            >
              Try again
            </button>
            <button
              type="button"
              onClick={clearAndReload}
              style={{
                minHeight: "2.75rem",
                padding: "0 1.25rem",
                borderRadius: "0.5rem",
                cursor: "pointer",
                backgroundColor: "transparent",
                border: "1px solid rgba(238,234,228,0.22)",
                color: "#eeeae4",
                font: "500 0.875rem system-ui, sans-serif",
              }}
            >
              Clear local data and reload
            </button>
          </div>
          {error.digest ? (
            <p
              style={{
                marginTop: "1.5rem",
                fontSize: "0.7rem",
                color: "#a29b92",
                fontFamily: "monospace",
              }}
            >
              {error.digest}
            </p>
          ) : null}
        </main>
      </body>
    </html>
  );
}
