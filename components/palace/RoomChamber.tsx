"use client";

import Link from "next/link";
import { Pencil, Trash2 } from "lucide-react";
import type { KnowledgeObject, Room } from "@/lib/types";
import { RoomIcon } from "@/components/RoomIcon";
import { Menu } from "@/components/ui/Menu";
import { paletteColor, paletteTint, thresholdVars } from "@/lib/palette";

/**
 * One room on the floor-plan grid — a lit volume standing on the floor.
 *
 * Shares the `.threshold` treatment with `RoomThreshold`, so a chamber and the
 * dashboard's doorway list light up the same way: a short tick of the room's
 * colour at the leading edge that grows to a full jamb on approach. The
 * chamber's own background stays an inline palette wash, which is what
 * `e2e/palette.spec.ts` reads to prove room colour is not silently
 * transparent.
 *
 * The whole chamber is a link, laid over the content rather than wrapping it:
 * the context menu is a sibling, because a menu button nested inside a link is
 * the `nested-interactive` defect axe flags and a real problem for anyone
 * navigating by keyboard.
 */
export function RoomChamber({
  room,
  objects,
  onEdit,
  onDelete,
}: {
  room: Room;
  objects: KnowledgeObject[];
  onEdit: () => void;
  onDelete: () => void;
}) {
  const color = paletteColor(room.palette);
  const previews = objects.slice(0, 8);

  return (
    <div
      className="threshold group relative flex flex-col overflow-hidden rounded-lg border border-border-hair p-3 transition-quiet hover:border-border-strong hover:shadow-raise sm:p-4"
      style={
        {
          gridColumn: `${room.position.x + 1} / span ${room.position.w}`,
          gridRow: `${room.position.y + 1} / span ${room.position.h}`,
          backgroundColor: paletteTint(room.palette, "wash"),
          ...thresholdVars(room.palette),
        } as React.CSSProperties
      }
    >
      <Link
        href={`/room?r=${room.id}`}
        className="absolute inset-0 z-0 rounded-lg focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2"
        aria-label={`Open ${room.name}`}
      />

      {/* Where the objects sit inside the room, in miniature. */}
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        {previews.map((object) => (
          <span
            key={object.id}
            className="absolute h-1.5 w-1.5 rounded-full opacity-45 transition-quiet group-hover:opacity-80"
            style={{
              left: `${object.position.x}%`,
              top: `${object.position.y}%`,
              backgroundColor: color,
            }}
          />
        ))}
      </div>

      {/* Non-interactive so clicks fall through to the link above. */}
      <div className="pointer-events-none relative z-[var(--z-raised)] flex h-full flex-col">
        <span
          className="mb-2.5 flex h-9 w-9 items-center justify-center rounded-md"
          style={{ backgroundColor: paletteTint(room.palette, "chip"), color }}
        >
          <RoomIcon name={room.icon} size={18} strokeWidth={1.75} aria-hidden />
        </span>
        <h3 className="font-display text-base leading-tight font-semibold tracking-tight text-text">
          {room.name}
        </h3>
        <p className="mt-1 line-clamp-2 text-xs text-muted">
          {room.description}
        </p>
        <span className="tabular mt-auto pt-2 text-xs text-muted">
          {objects.length} {objects.length === 1 ? "object" : "objects"}
        </span>
      </div>

      <div className="absolute top-1.5 right-1.5 z-[var(--z-raised)]">
        <Menu
          label={`Actions for ${room.name}`}
          triggerClassName="opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 max-md:opacity-100"
          items={[
            { label: "Edit room", icon: Pencil, onSelect: onEdit },
            {
              label: "Delete room",
              icon: Trash2,
              onSelect: onDelete,
              danger: true,
            },
          ]}
        />
      </div>
    </div>
  );
}
