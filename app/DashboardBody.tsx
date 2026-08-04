"use client";

import { useMemo } from "react";
import { useRoomMap } from "@/lib/hooks/use-room-map";
import Link from "next/link";
import { Castle } from "lucide-react";
import { usePalaceStore } from "@/lib/store";
import { RoomIcon } from "@/components/RoomIcon";
import { paletteColor, paletteTint } from "@/lib/palette";
import { activityPhrase, relativeTime } from "@/lib/activity-text";
import { QuickAdd } from "@/components/dashboard/QuickAdd";
import { useHydrated } from "@/lib/hooks/use-hydrated";
import { DashboardSkeleton } from "@/components/skeletons/RouteSkeletons";
import { EmptyState } from "@/components/ui/EmptyState";
import { ObjectRow } from "@/components/objects/ObjectRow";
import { byUpdatedDesc } from "@/lib/sort";

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
  const countFor = (roomId: string) => countByRoom.get(roomId) ?? 0;

  const recentRooms = useMemo(
    () => [...rooms].sort(byUpdatedDesc).slice(0, 4),
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
              className="inline-flex h-10 items-center gap-2 rounded-lg bg-accent px-5 text-sm font-medium text-on-accent transition-colors duration-200 hover:bg-accent-hover"
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
      {/* Quick add */}
      <div className="mt-6">
        <QuickAdd />
      </div>

      <div className="mt-10 grid grid-cols-1 gap-10 lg:grid-cols-3">
        <div className="space-y-10 lg:col-span-2">
          {/* Recent rooms */}
          <section>
            <h2 className="mb-4 font-display text-xl tracking-wide text-text">
              Recent rooms
            </h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {recentRooms.map((room) => {
                const color = paletteColor(room.palette);
                const count = countFor(room.id);
                return (
                  <Link
                    key={room.id}
                    href={`/room?r=${room.id}`}
                    className="group flex items-start gap-4 rounded-xl border border-border-hair bg-surface p-4 transition-[background-color,border-color,box-shadow] duration-200 hover:border-border-strong hover:bg-surface-2 hover:shadow-[0_2px_24px_-8px_var(--palace-accent-glow)]"
                  >
                    <span
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg"
                      style={{
                        backgroundColor: paletteTint(room.palette, "chip"),
                        color,
                      }}
                    >
                      <RoomIcon name={room.icon} size={20} strokeWidth={1.75} />
                    </span>
                    <div className="min-w-0">
                      <h3 className="font-display text-lg leading-tight text-text">
                        {room.name}
                      </h3>
                      <p className="mt-0.5 line-clamp-1 text-sm text-muted">
                        {room.description}
                      </p>
                      <p className="mt-2 text-xs tracking-wide text-muted">
                        {count} {count === 1 ? "object" : "objects"}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>

          {/* Recent objects */}
          <section>
            <h2 className="mb-4 font-display text-xl tracking-wide text-text">
              Recent objects
            </h2>
            <ul className="divide-y divide-border-hair overflow-hidden rounded-xl border border-border-hair">
              {recentObjects.length === 0 ? (
                <li className="px-4 py-6 text-center text-sm text-muted">
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
                      className="w-full bg-surface px-4 py-3 transition-colors hover:bg-surface-2"
                    >
                      <ObjectRow
                        object={object}
                        palette={room?.palette}
                        roomName={room?.name}
                        size="md"
                        trailing={
                          <time className="shrink-0 text-xs text-muted">
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
        </div>

        {/* Activity */}
        <section>
          <h2 className="mb-4 font-display text-xl tracking-wide text-text">
            Activity
          </h2>
          <ol className="space-y-1">
            {activity.slice(0, 12).map((event) => (
              <li
                key={event.id}
                className="flex items-baseline justify-between gap-3 rounded-lg px-3 py-2 hover:bg-surface"
              >
                <span className="min-w-0 text-sm text-text">
                  {activityPhrase(event, rooms, objects)}
                </span>
                <time className="shrink-0 text-xs text-muted">
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
