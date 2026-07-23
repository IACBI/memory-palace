"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Castle } from "lucide-react";
import { usePalaceStore } from "@/lib/store";
import { RoomIcon } from "@/components/RoomIcon";
import { paletteColor } from "@/lib/palette";
import { OBJECT_TYPE_META } from "@/lib/object-meta";
import { activityPhrase, relativeTime } from "@/lib/activity-text";
import { QuickAdd } from "@/components/dashboard/QuickAdd";
import { EmptyState } from "@/components/ui/EmptyState";

function greeting(): string {
  const h = new Date().getHours();
  if (h < 5) return "Still awake";
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  if (h < 21) return "Good evening";
  return "Good night";
}

function byUpdatedDesc<T extends { updatedAt: string }>(a: T, b: T): number {
  return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
}

export default function DashboardPage() {
  const rooms = usePalaceStore((s) => s.rooms);
  const objects = usePalaceStore((s) => s.objects);
  const connections = usePalaceStore((s) => s.connections);
  const activity = usePalaceStore((s) => s.activity);
  const openObject = usePalaceStore((s) => s.openObject);

  const roomById = useMemo(
    () => new Map(rooms.map((r) => [r.id, r])),
    [rooms],
  );
  const countByRoom = useMemo(() => {
    const counts = new Map<string, number>();
    for (const o of objects) counts.set(o.roomId, (counts.get(o.roomId) ?? 0) + 1);
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

  if (rooms.length === 0) {
    return (
      <div className="mx-auto max-w-6xl px-5 py-10 sm:px-8">
        <header className="border-b border-border-hair pb-6">
          <h1 className="font-display text-4xl leading-none font-semibold tracking-wide text-text">
            {greeting()}
          </h1>
          <p className="mt-2 text-sm text-muted">Your palace is empty.</p>
        </header>
        <div className="mt-10">
          <EmptyState
            icon={Castle}
            title="Begin your palace"
            hint="Every idea needs a room. Create your first chamber, then fill it with notes, links, and ideas."
            action={
              <Link
                href="/palace"
                className="inline-flex h-10 items-center gap-2 rounded-lg bg-accent px-5 text-sm font-medium text-[#1a1410] transition-all duration-200 hover:bg-accent-hover"
              >
                Create a room
              </Link>
            }
          />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-5 py-10 sm:px-8">
      {/* Greeting */}
      <header className="border-b border-border-hair pb-6">
        <h1 className="font-display text-4xl leading-none font-semibold tracking-wide text-text">
          {greeting()}
        </h1>
        <p className="mt-2 text-sm text-muted">
          {rooms.length} {rooms.length === 1 ? "room" : "rooms"} ·{" "}
          {objects.length} {objects.length === 1 ? "object" : "objects"} ·{" "}
          {connections.length}{" "}
          {connections.length === 1 ? "connection" : "connections"}
        </p>
      </header>

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
                    className="group flex items-start gap-4 rounded-xl border border-border-hair bg-surface p-4 transition-all duration-200 hover:border-border-strong hover:bg-surface-2 hover:shadow-[0_2px_24px_-8px_var(--palace-accent-glow)]"
                  >
                    <span
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg"
                      style={{ backgroundColor: `${color}22`, color }}
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
                const color = room
                  ? paletteColor(room.palette)
                  : "var(--palace-muted)";
                const Glyph = OBJECT_TYPE_META[object.type].icon;
                return (
                  <li key={object.id}>
                    <button
                      type="button"
                      onClick={() => openObject(object.id)}
                      className="flex w-full items-center gap-3 bg-surface px-4 py-3 text-left transition-colors hover:bg-surface-2"
                    >
                      <span
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md"
                        style={{ backgroundColor: `${color}22`, color }}
                      >
                        <Glyph size={15} strokeWidth={1.75} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm text-text">
                          {object.title}
                        </span>
                        <span className="block truncate text-xs text-muted">
                          {room?.name ?? "Unassigned"}
                        </span>
                      </span>
                      <time className="shrink-0 text-xs text-muted">
                        {relativeTime(object.updatedAt)}
                      </time>
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
    </div>
  );
}
