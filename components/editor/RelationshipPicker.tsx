"use client";

import { useState } from "react";
import { useRoomMap } from "@/lib/hooks/use-room-map";
import { Plus, Search } from "lucide-react";
import type { KnowledgeObject, Room } from "@/lib/types";
import { paletteColor } from "@/lib/palette";

/** Searchable list of objects to connect the current object to. */
export function RelationshipPicker({
  candidates,
  rooms,
  onPick,
}: {
  candidates: KnowledgeObject[];
  rooms: Room[];
  onPick: (toId: string, label: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [label, setLabel] = useState("");

  const roomById = useRoomMap(rooms);
  const results = candidates
    .filter((object) =>
      query ? object.title.toLowerCase().includes(query.toLowerCase()) : true,
    )
    .slice(0, 8);

  return (
    <div className="rounded-lg border border-border-hair bg-surface-2/50 p-3">
      <div className="flex items-center gap-2 rounded-lg border border-border-hair bg-surface px-2.5 py-1.5">
        <Search size={14} strokeWidth={1.75} className="text-muted" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Find an object to connect…"
          className="flex-1 bg-transparent text-sm text-text placeholder:text-muted focus:outline-none"
          aria-label="Search objects to connect"
        />
      </div>

      <input
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        placeholder="Optional label (e.g. builds on)"
        className="mt-2 w-full rounded-lg border border-border-hair bg-surface px-2.5 py-1.5 text-xs text-text placeholder:text-muted focus:border-accent-dim focus:outline-none"
        aria-label="Connection label"
      />

      <ul className="mt-2 max-h-52 space-y-1 overflow-y-auto">
        {results.map((object) => {
          const room = roomById.get(object.roomId);
          const color = room
            ? paletteColor(room.palette)
            : "var(--palace-muted)";
          return (
            <li key={object.id}>
              <button
                type="button"
                onClick={() => {
                  onPick(object.id, label.trim());
                  setLabel("");
                  setQuery("");
                }}
                className="group flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left transition-colors hover:bg-surface"
              >
                <span
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{ backgroundColor: color }}
                  aria-hidden
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm text-text">
                    {object.title}
                  </span>
                  <span className="block truncate text-[11px] text-muted">
                    {room?.name ?? "Unassigned"}
                  </span>
                </span>
                <Plus
                  size={14}
                  strokeWidth={1.75}
                  className="text-muted opacity-0 transition-opacity group-hover:opacity-100"
                />
              </button>
            </li>
          );
        })}
        {results.length === 0 ? (
          <li className="px-2 py-3 text-center text-xs text-muted">
            No other objects to connect.
          </li>
        ) : null}
      </ul>
    </div>
  );
}
