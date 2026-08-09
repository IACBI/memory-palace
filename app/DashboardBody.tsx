"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Castle } from "lucide-react";
import { useRoomMap } from "@/lib/hooks/use-room-map";
import { usePalaceStore } from "@/lib/store";
import { activityPhrase, relativeTime } from "@/lib/activity-text";
import { QuickAdd } from "@/components/dashboard/QuickAdd";
import { useHydrated } from "@/lib/hooks/use-hydrated";
import { DashboardSkeleton } from "@/components/skeletons/RouteSkeletons";
import { EmptyState } from "@/components/ui/EmptyState";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { ObjectRow } from "@/components/objects/ObjectRow";
import { RoomThreshold } from "@/components/palace/RoomThreshold";
import { byUpdatedDesc } from "@/lib/sort";

/** How many rooms the stagger runs over before every later row shares a delay. */
const STAGGER_CAP = 6;

export function DashboardBody() {
  const hydrated = useHydrated();
  const rooms = usePalaceStore((s) => s.rooms);
  const objects = usePalaceStore((s) => s.objects);
  const activity = usePalaceStore((s) => s.activity);
  const openObject = usePalaceStore((s) => s.openObject);

  const roomById = useRoomMap(rooms);
  const countByRoom = useMemo(() => {
    const counts = new Map<string, number>();
    for (const o of objects)
      counts.set(o.roomId, (counts.get(o.roomId) ?? 0) + 1);
    return counts;
  }, [objects]);

  const recentRooms = useMemo(
    () => [...rooms].sort(byUpdatedDesc).slice(0, 6),
    [rooms],
  );
  const recentObjects = useMemo(
    () => [...objects].sort(byUpdatedDesc).slice(0, 6),
    [objects],
  );

  if (!hydrated) return <DashboardSkeleton />;

  if (rooms.length === 0) {
    return (
      <div className="mt-10">
        <EmptyState
          icon={Castle}
          title="Begin your palace"
          hint="Every idea needs a room. Create your first chamber, then fill it with notes, links, and ideas."
          action={
            <Link
              href="/palace"
              className="inline-flex h-11 items-center gap-2 rounded-md bg-accent px-5 text-sm font-medium text-on-accent transition-quiet hover:bg-accent-hover hover:shadow-spill"
            >
              Create a room
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <>
      <div className="mt-8">
        <QuickAdd />
      </div>

      {/* The doorways. Given the full width on purpose — a threshold read as a
          narrow card is just a card. */}
      <section className="mt-12">
        <SectionLabel>Where you left off</SectionLabel>
        <ul className="-mx-1">
          {recentRooms.map((room, index) => (
            <RoomThreshold
              key={room.id}
              room={room}
              count={countByRoom.get(room.id) ?? 0}
              index={Math.min(index, STAGGER_CAP)}
            />
          ))}
        </ul>
      </section>

      <div className="mt-12 grid grid-cols-1 gap-10 lg:grid-cols-5 lg:gap-12">
        <section className="lg:col-span-3">
          <SectionLabel>Recent objects</SectionLabel>
          <ul className="divide-y divide-border-hair overflow-hidden rounded-lg border border-border-hair">
            {recentObjects.length === 0 ? (
              <li className="bg-surface px-4 py-6 text-center text-sm text-muted">
                No objects yet — add one with quick add above.
              </li>
            ) : null}
            {recentObjects.map((object) => {
              const room = roomById.get(object.roomId);
              return (
                <li key={object.id}>
                  <button
                    type="button"
                    onClick={() => openObject(object.id)}
                    className="min-h-14 w-full bg-surface px-4 py-3 transition-quiet hover:bg-surface-2"
                  >
                    <ObjectRow
                      object={object}
                      palette={room?.palette}
                      roomName={room?.name}
                      size="md"
                      trailing={
                        <time className="tabular shrink-0 text-xs text-muted">
                          {relativeTime(object.updatedAt)}
                        </time>
                      }
                    />
                  </button>
                </li>
              );
            })}
          </ul>
        </section>

        <section className="lg:col-span-2">
          <SectionLabel>Activity</SectionLabel>
          <ol className="space-y-0.5">
            {activity.slice(0, 12).map((event) => (
              <li
                key={event.id}
                className="flex items-baseline justify-between gap-3 rounded-md px-3 py-2 transition-quiet hover:bg-surface"
              >
                <span className="min-w-0 text-sm text-text">
                  {activityPhrase(event, rooms, objects)}
                </span>
                <time className="tabular shrink-0 text-xs text-muted">
                  {relativeTime(event.at)}
                </time>
              </li>
            ))}
            {activity.length === 0 ? (
              <li className="px-3 py-2 text-sm text-muted">Nothing yet.</li>
            ) : null}
          </ol>
        </section>
      </div>
    </>
  );
}
