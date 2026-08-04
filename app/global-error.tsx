"use client";

import { useEffect } from "react";
import { PREFS_KEY } from "@/lib/prefs";
import { STORAGE_KEY } from "@/lib/storage/local-storage";

/**
 * The last line of defence: catches errors thrown by the root layout itself,
 * which `app/error.tsx` cannot see. Renders its own `<html>` and `<body>` and
 * cannot rely on the app's stylesheet, so the styling is inline.
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
          backgroundColor: "#121110",
          color: "#e8e3d8",
          fontFamily: "Georgia, 'Times New Roman', serif",
          padding: "2rem",
        }}
      >
        <title>Something broke · Memory Palace</title>
        <main style={{ maxWidth: "32rem", textAlign: "center" }}>
          <h1
            style={{
              fontSize: "2rem",
              fontWeight: 600,
              letterSpacing: "0.02em",
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
              color: "#9a917f",
              fontFamily: "system-ui, sans-serif",
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
                height: "2.5rem",
                padding: "0 1.25rem",
                borderRadius: "0.5rem",
                border: "none",
                cursor: "pointer",
                backgroundColor: "#c9a227",
                color: "#1a1410",
                font: "500 0.875rem system-ui, sans-serif",
              }}
            >
              Try again
            </button>
            <button
              type="button"
              onClick={clearAndReload}
              style={{
                height: "2.5rem",
                padding: "0 1.25rem",
                borderRadius: "0.5rem",
                cursor: "pointer",
                backgroundColor: "transparent",
                border: "1px solid rgba(232,227,216,0.22)",
                color: "#e8e3d8",
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
                color: "#9a917f",
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
