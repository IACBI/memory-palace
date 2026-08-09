import type { Metadata } from "next";
import { PageHeader } from "@/components/shell/PageHeader";
import { GraphBody } from "@/app/graph/GraphBody";

export const metadata: Metadata = {
  title: "Graph",
  description:
    "Your web of knowledge: objects as nodes, coloured by room, linked by the connections between them.",
};

/**
 * Wider than the reading routes: the graph is the one screen whose whole job is
 * to show as much of the palace at once as the window allows.
 */
export default function GraphPage() {
  return (
    <div className="mx-auto max-w-[100rem] px-4 py-8 sm:px-8 sm:py-10">
      <PageHeader
        title="Graph"
        subtitle="Your web of knowledge. Objects are nodes, coloured by room; lines are the links between them."
      />
      <GraphBody />
    </div>
  );
}
