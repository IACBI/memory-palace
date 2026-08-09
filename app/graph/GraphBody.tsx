"use client";

import dynamic from "next/dynamic";
import { Share2 } from "lucide-react";
import { usePalaceStore } from "@/lib/store";
import { useHydrated } from "@/lib/hooks/use-hydrated";
import { EmptyState } from "@/components/ui/EmptyState";
import { GraphSkeleton } from "@/components/skeletons/RouteSkeletons";

/**
 * `d3-force` is only ever used by this one view, so it is split out of the
 * shared chunk and fetched when the graph is actually about to be drawn.
 * `ssr: false` because the simulation needs layout measurements that do not
 * exist on the server; the skeleton is the server-rendered stand-in.
 */
const GraphView = dynamic(
  () => import("@/components/graph/GraphView").then((m) => m.GraphView),
  { ssr: false, loading: () => <GraphSkeleton /> },
);

export function GraphBody() {
  const hydrated = useHydrated();
  const objects = usePalaceStore((state) => state.objects);
  const rooms = usePalaceStore((state) => state.rooms);
  const connections = usePalaceStore((state) => state.connections);

  if (!hydrated) return <GraphSkeleton />;

  if (objects.length === 0) {
    return (
      <div className="mt-8">
        <EmptyState
          icon={Share2}
          title="Nothing to plot yet"
          hint="Add objects to your rooms, then connect related ones from the object editor to see them here."
        />
      </div>
    );
  }

  // Unconnected objects are still worth seeing: a constellation of separate
  // nodes is a valid graph, and hiding it made a populated palace look empty.
  return (
    <div className="mt-8">
      <GraphView objects={objects} rooms={rooms} connections={connections} />
      {connections.length === 0 ? (
        <p className="mt-4 text-center text-sm text-muted">
          Nothing is linked yet. Open an object and use its Relationships
          section to draw the first connection.
        </p>
      ) : null}
    </div>
  );
}
