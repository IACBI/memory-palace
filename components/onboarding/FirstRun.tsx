"use client";

import { Compass, Sparkles } from "lucide-react";
import { usePalaceStore } from "@/lib/store";
import { Kbd } from "@/components/ui/Kbd";

/**
 * The choice a first-time visitor gets instead of silently inheriting the
 * sample palace. Someone else's six rooms appearing with no explanation made
 * the demo content look like the user's own data.
 *
 * The orientation line at the foot is deliberately part of this screen rather
 * than a tour that runs after it. A modal walkthrough would stand between the
 * reader and the palace at the exact moment they chose to go in, and it is the
 * first thing anyone dismisses without reading.
 */
export function FirstRun() {
  const hydrationState = usePalaceStore((state) => state.hydrationState);
  const completeFirstRun = usePalaceStore((state) => state.completeFirstRun);

  if (hydrationState !== "first-run") return null;

  return (
    <div className="fixed inset-0 z-[var(--z-toast)] flex items-center justify-center overflow-y-auto bg-ground/95 px-5 py-10 backdrop-blur-sm">
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
          className="font-display text-3xl leading-tight font-semibold tracking-tight text-text sm:text-4xl"
        >
          Welcome to your
          <span className="block text-accent">Memory Palace</span>
        </h2>
        <p className="mx-auto mt-4 max-w-sm text-sm leading-relaxed text-muted">
          Rooms hold ideas the way places hold memories. Start with an empty
          floor plan, or walk through a furnished one first.
        </p>

        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => completeFirstRun("sample")}
            className="group flex flex-col items-start gap-2 rounded-lg border border-border-strong bg-surface p-5 text-left transition-quiet hover:border-accent-dim hover:bg-surface-2"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-md bg-accent/15 text-accent">
              <Compass size={18} strokeWidth={1.75} aria-hidden />
            </span>
            <span className="font-display text-base font-semibold text-text">
              Explore a sample palace
            </span>
            <span className="text-xs leading-relaxed text-muted">
              Six furnished rooms to look around. Clear it whenever you like.
            </span>
          </button>

          <button
            type="button"
            onClick={() => completeFirstRun("empty")}
            className="group flex flex-col items-start gap-2 rounded-lg border border-border-hair bg-surface p-5 text-left transition-quiet hover:border-border-strong hover:bg-surface-2"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-md bg-surface-2 text-muted transition-quiet group-hover:text-text">
              <Sparkles size={18} strokeWidth={1.75} aria-hidden />
            </span>
            <span className="font-display text-base font-semibold text-text">
              Start empty
            </span>
            <span className="text-xs leading-relaxed text-muted">
              A blank floor plan. Build your first room from scratch.
            </span>
          </button>
        </div>

        {/* Each hint stays on one line and the row wraps between them; letting
            a single hint break in half made the three read as six. */}
        <ul className="mt-7 flex flex-col items-center gap-2 text-xs text-muted sm:flex-row sm:flex-wrap sm:justify-center sm:gap-x-5 sm:gap-y-2">
          <li className="flex items-center gap-1.5 whitespace-nowrap">
            Open a chamber to step inside it
          </li>
          <li className="flex items-center gap-1.5 whitespace-nowrap">
            <Kbd>Ctrl</Kbd>
            <Kbd>K</Kbd> searches everything
          </li>
          <li className="flex items-center gap-1.5 whitespace-nowrap">
            <Kbd>?</Kbd> lists every shortcut
          </li>
        </ul>

        <p className="mt-6 text-2xs tracking-wide text-muted">
          Everything stays in this browser. Nothing is uploaded.
        </p>
      </div>
    </div>
  );
}
