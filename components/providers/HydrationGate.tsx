"use client";

import { useState } from "react";
import { DatabaseBackup, TriangleAlert } from "lucide-react";
import { usePalaceStore } from "@/lib/store";
import { Button } from "@/components/ui/Button";

/**
 * Replaces page content when the palace could not be read from storage.
 *
 * Only this narrow case is gated. Loading is handled by each screen's own
 * skeleton so the chrome and headings still render — the app used to hold the
 * entire tree behind a spinner, and a rejected read left it there forever.
 */
export function HydrationGate({ children }: { children: React.ReactNode }) {
  const hydrationState = usePalaceStore((state) => state.hydrationState);
  const hydrationError = usePalaceStore((state) => state.hydrationError);
  const completeFirstRun = usePalaceStore((state) => state.completeFirstRun);
  const [copied, setCopied] = useState(false);

  if (hydrationState !== "error") return <>{children}</>;

  const diagnostics = [
    "Memory Palace — hydration failure",
    `When: ${new Date().toISOString()}`,
    `Agent: ${typeof navigator === "undefined" ? "unknown" : navigator.userAgent}`,
    `Error: ${hydrationError ?? "unknown"}`,
  ].join("\n");

  return (
    <div className="mx-auto flex max-w-lg flex-col items-center px-6 py-20 text-center sm:py-24">
      <span className="mb-5 flex h-16 w-16 items-center justify-center rounded-full border border-border-hair bg-surface-2 text-danger">
        <TriangleAlert size={26} strokeWidth={1.5} aria-hidden />
      </span>
      <h1 className="font-display text-3xl font-bold tracking-tight text-balance text-text sm:text-4xl">
        We couldn&apos;t open your palace
      </h1>
      <p className="mt-3 text-sm text-muted">
        The saved data in this browser could not be read. Nothing has been
        deleted — starting fresh leaves the old entry untouched until you save
        over it.
      </p>

      <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
        <Button variant="primary" onClick={() => completeFirstRun("empty")}>
          <DatabaseBackup size={16} strokeWidth={1.75} aria-hidden />
          Start fresh
        </Button>
        <Button
          variant="ghost"
          onClick={() => {
            void navigator.clipboard?.writeText(diagnostics).then(
              () => setCopied(true),
              () => setCopied(false),
            );
          }}
        >
          {copied ? "Diagnostics copied" : "Copy diagnostics"}
        </Button>
      </div>

      {hydrationError ? (
        <p className="mt-6 max-w-full truncate font-mono text-2xs text-muted">
          {hydrationError}
        </p>
      ) : null}
    </div>
  );
}
