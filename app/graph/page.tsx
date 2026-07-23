"use client";

import { Share2 } from "lucide-react";
import { usePalaceStore } from "@/lib/store";
import { PageHeader } from "@/components/shell/PageHeader";
import { GraphView } from "@/components/graph/GraphView";
import { EmptyState } from "@/components/ui/EmptyState";

export default function GraphPage() {
  const objects = usePalaceStore((state) => state.objects);
  const rooms = usePalaceStore((state) => state.rooms);
  const connections = usePalaceStore((state) => state.connections);

  return (
    <div className="mx-auto max-w-6xl px-5 py-10 sm:px-8">
      <PageHeader
        title="Graph"
        subtitle="Your web of knowledge. Objects are nodes, coloured by room; lines are the links between them."
      />

      <div className="mt-8">
        {objects.length === 0 ? (
          <EmptyState
            icon={Share2}
            title="Nothing to plot yet"
            hint="Add objects to your rooms, then connect related ones from the object editor to see them here."
          />
        ) : connections.length === 0 ? (
          <EmptyState
            icon={Share2}
            title="No connections yet"
            hint="Open an object and use its Relationships section to link it to another. Your web of knowledge will grow here."
          />
        ) : (
          <GraphView objects={objects} rooms={rooms} connections={connections} />
        )}
      </div>
    </div>
  );
}
