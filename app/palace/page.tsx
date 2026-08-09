import type { Metadata } from "next";
import { CanvasStage } from "@/components/shell/CanvasStage";
import { NewRoomButton } from "@/app/palace/NewRoomButton";
import { PalaceBody } from "@/app/palace/PalaceBody";

export const metadata: Metadata = {
  title: "The Palace",
  description:
    "Your rooms, laid out as a floor plan. Every topic gets a chamber.",
};

/**
 * A floor plan is a place, not a figure. It gets the window like the graph and
 * a room do, with its title floating over it rather than sitting above it — and
 * it keeps a real, visible `h1`, which `e2e/smoke.spec.ts` checks on every
 * route and `e2e/onboarding.spec.ts` checks with JavaScript disabled.
 */
export default function PalacePage() {
  return (
    <CanvasStage>
      <div className="pointer-events-none absolute inset-x-0 top-0 z-[var(--z-raised)] flex flex-wrap items-start justify-between gap-4 px-4 py-4 sm:px-6 sm:py-5">
        <div className="min-w-0">
          <h1 className="font-display text-2xl leading-tight font-bold tracking-tight text-text sm:text-3xl">
            The Palace
          </h1>
          <p className="mt-1.5 max-w-md text-sm text-pretty text-muted">
            Your rooms, laid out as a floor plan. Open a chamber to enter.
          </p>
        </div>
        <div className="pointer-events-auto">
          <NewRoomButton />
        </div>
      </div>

      <PalaceBody />
    </CanvasStage>
  );
}
