import type { Metadata } from "next";
import { CanvasStage } from "@/components/shell/CanvasStage";
import { GraphBody } from "@/app/graph/GraphBody";

export const metadata: Metadata = {
  title: "Graph",
  description:
    "Your web of knowledge: objects as nodes, coloured by room, linked by the connections between them.",
};

/**
 * The graph is the one screen whose whole job is to show as much of the palace
 * at once as the window allows, so it is given the window: no reading column,
 * no `PageHeader` pushing it down, no card around it. The title floats over the
 * canvas instead of sitting above it.
 *
 * It still renders as a real, visible `h1` on the server — `e2e/smoke.spec.ts`
 * checks every route has one, and `e2e/onboarding.spec.ts` checks this route
 * has one with JavaScript disabled.
 */
export default function GraphPage() {
  return (
    <CanvasStage>
      <div className="pointer-events-none absolute top-0 left-0 z-[var(--z-raised)] max-w-sm p-4 sm:p-6">
        <h1 className="font-display text-2xl leading-tight font-bold tracking-tight text-text sm:text-3xl">
          Graph
        </h1>
        <p className="mt-1.5 text-sm text-pretty text-muted">
          Your web of knowledge. Objects are nodes, coloured by room; lines are
          the links between them.
        </p>
      </div>

      <GraphBody />
    </CanvasStage>
  );
}
