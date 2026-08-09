"use client";

import { usePalaceStore } from "@/lib/store";
import { useHydrated } from "@/lib/hooks/use-hydrated";

const plural = (n: number, one: string, many: string) =>
  `${n} ${n === 1 ? one : many}`;

/**
 * The one-line count under the greeting.
 *
 * Set in tabular figures so the numbers keep their columns as they change —
 * this line re-renders on every edit, and proportional digits make it twitch.
 * `e2e/smoke.spec.ts` matches the `N rooms · N objects` shape, so the
 * separator and wording are load-bearing.
 */
export function DashboardStats() {
  const hydrated = useHydrated();
  const rooms = usePalaceStore((s) => s.rooms.length);
  const objects = usePalaceStore((s) => s.objects.length);
  const connections = usePalaceStore((s) => s.connections.length);

  if (!hydrated) {
    return <p className="mt-4 h-5 text-sm text-muted" aria-hidden />;
  }

  if (rooms === 0) {
    return <p className="mt-4 text-sm text-muted">Your palace is empty.</p>;
  }

  return (
    <p className="tabular mt-4 text-sm text-muted">
      {plural(rooms, "room", "rooms")} · {plural(objects, "object", "objects")}{" "}
      · {plural(connections, "connection", "connections")}
    </p>
  );
}
