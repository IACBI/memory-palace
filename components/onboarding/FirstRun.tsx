"use client";

import { Compass, Sparkles } from "lucide-react";
import { usePalaceStore } from "@/lib/store";

/**
 * The choice a first-time visitor gets instead of silently inheriting the
 * sample palace. Someone else's six rooms appearing with no explanation made
 * the demo content look like the user's own data.
 */
export function FirstRun() {
  const hydrationState = usePalaceStore((state) => state.hydrationState);
  const completeFirstRun = usePalaceStore((state) => state.completeFirstRun);

  if (hydrationState !== "first-run") return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-base/95 px-6 backdrop-blur-sm">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="first-run-title"
        className="motion-dialog-in w-full max-w-lg text-center"
      >
        {/* h2, not h1: the page behind already owns the document heading, and
            two h1s on one screen is a real navigation problem. */}
        <h2
          id="first-run-title"
          className="font-display text-4xl leading-tight tracking-wide text-text"
        >
          Welcome to your
          <span className="block text-accent">Memory Palace</span>
        </h2>
        <p className="mx-auto mt-4 max-w-sm text-sm leading-relaxed text-muted">
          Rooms hold ideas the way places hold memories. Start with an empty
          floor plan, or walk through a furnished one first.
        </p>

        <div className="mt-9 grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => completeFirstRun("sample")}
            className="group flex flex-col items-start gap-2 rounded-xl border border-border-strong bg-surface p-5 text-left transition-colors hover:border-accent-dim hover:bg-surface-2"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/15 text-accent">
              <Compass size={18} strokeWidth={1.75} aria-hidden />
            </span>
            <span className="font-display text-lg text-text">
              Explore a sample palace
            </span>
            <span className="text-xs leading-relaxed text-muted">
              Six furnished rooms to look around. Clear it whenever you like.
            </span>
          </button>

          <button
            type="button"
            onClick={() => completeFirstRun("empty")}
            className="group flex flex-col items-start gap-2 rounded-xl border border-border-hair bg-surface p-5 text-left transition-colors hover:border-border-strong hover:bg-surface-2"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-surface-2 text-muted transition-colors group-hover:text-text">
              <Sparkles size={18} strokeWidth={1.75} aria-hidden />
            </span>
            <span className="font-display text-lg text-text">Start empty</span>
            <span className="text-xs leading-relaxed text-muted">
              A blank floor plan. Build your first room from scratch.
            </span>
          </button>
        </div>

        <p className="mt-7 text-[11px] tracking-wide text-muted">
          Everything stays in this browser. Nothing is uploaded.
        </p>
      </div>
    </div>
  );
}
