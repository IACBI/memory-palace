import type { Metadata } from "next";
import { PageHeader } from "@/components/shell/PageHeader";
import { GraphBody } from "@/app/graph/GraphBody";

export const metadata: Metadata = {
  title: "Graph",
  description:
    "Your web of knowledge: objects as nodes, coloured by room, linked by the connections between them.",
};

export default function GraphPage() {
  return (
    <div className="mx-auto max-w-6xl px-5 py-10 sm:px-8">
      <PageHeader
        title="Graph"
        subtitle="Your web of knowledge. Objects are nodes, coloured by room; lines are the links between them."
      />
      <GraphBody />
    </div>
  );
}
