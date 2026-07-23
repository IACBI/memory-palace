"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { MoreVertical, Pencil, Trash2 } from "lucide-react";
import type { KnowledgeObject, Room } from "@/lib/types";
import { RoomIcon } from "@/components/RoomIcon";
import { paletteColor } from "@/lib/palette";

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
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const onDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    window.addEventListener("mousedown", onDown);
    return () => window.removeEventListener("mousedown", onDown);
  }, [menuOpen]);

  const previews = objects.slice(0, 8);

  return (
    <div
      className="group relative flex flex-col overflow-hidden rounded-xl border border-border-hair p-4 transition-all duration-200 hover:border-border-strong hover:shadow-[0_4px_40px_-12px_var(--glow)]"
      style={
        {
          gridColumn: `${room.position.x + 1} / span ${room.position.w}`,
          gridRow: `${room.position.y + 1} / span ${room.position.h}`,
          backgroundColor: `${color}14`,
          boxShadow: `inset 3px 0 0 0 ${color}`,
          ["--glow" as string]: `${color}66`,
        } as React.CSSProperties
      }
    >
      {/* Navigation overlay (accessible) */}
      <Link
        href={`/room?r=${room.id}`}
        className="absolute inset-0 z-0 rounded-xl focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2"
        aria-label={`Open ${room.name}`}
      />

      {/* Preview dots */}
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        {previews.map((object) => (
          <span
            key={object.id}
            className="absolute h-1.5 w-1.5 rounded-full opacity-50"
            style={{
              left: `${object.position.x}%`,
              top: `${object.position.y}%`,
              backgroundColor: color,
            }}
          />
        ))}
      </div>

      {/* Content (non-interactive so clicks fall to the overlay) */}
      <div className="pointer-events-none relative z-[1] flex h-full flex-col">
        <span
          className="mb-2 flex h-9 w-9 items-center justify-center rounded-lg"
          style={{ backgroundColor: `${color}26`, color }}
        >
          <RoomIcon name={room.icon} size={18} strokeWidth={1.75} />
        </span>
        <h3 className="font-display text-lg leading-tight text-text">
          {room.name}
        </h3>
        <p className="mt-1 line-clamp-2 text-xs text-muted">{room.description}</p>
        <span className="mt-auto pt-2 text-xs tracking-wide text-muted">
          {objects.length} {objects.length === 1 ? "object" : "objects"}
        </span>
      </div>

      {/* Context menu */}
      <div ref={menuRef} className="absolute top-2 right-2 z-10">
        <button
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
          aria-label={`Actions for ${room.name}`}
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          className="flex h-7 w-7 items-center justify-center rounded-md text-muted opacity-0 transition-all duration-200 group-hover:opacity-100 focus-visible:opacity-100 hover:bg-surface-2 hover:text-text"
        >
          <MoreVertical size={15} strokeWidth={1.75} />
        </button>
        {menuOpen ? (
          <div
            role="menu"
            className="animate-[dialogIn_150ms_ease-out] absolute top-8 right-0 w-36 overflow-hidden rounded-lg border border-border-strong bg-surface shadow-[0_12px_40px_-8px_rgba(0,0,0,0.7)]"
          >
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setMenuOpen(false);
                onEdit();
              }}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-text transition-colors hover:bg-surface-2"
            >
              <Pencil size={14} strokeWidth={1.75} /> Edit room
            </button>
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setMenuOpen(false);
                onDelete();
              }}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-danger transition-colors hover:bg-surface-2"
            >
              <Trash2 size={14} strokeWidth={1.75} /> Delete room
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
