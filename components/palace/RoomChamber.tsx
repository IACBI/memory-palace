"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { MoreVertical, Pencil, Trash2 } from "lucide-react";
import type { KnowledgeObject, Room } from "@/lib/types";
import { RoomIcon } from "@/components/RoomIcon";
import { paletteColor, paletteTint } from "@/lib/palette";
import { useDismissable } from "@/lib/hooks/use-dismissable";
import { useRovingTabIndex } from "@/lib/hooks/use-roving-tabindex";

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
  const [activeItem, setActiveItem] = useState(0);
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const closeMenu = useCallback(() => {
    setMenuOpen(false);
    triggerRef.current?.focus();
  }, []);

  // Escape now closes it, via the shared overlay stack. It previously listened
  // for `mousedown` only, so touch and keyboard users could not dismiss it.
  useDismissable(menuOpen, closeMenu);

  useEffect(() => {
    if (!menuOpen) return;
    const onDown = (e: Event) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    // `pointerdown` covers mouse, touch and pen alike.
    window.addEventListener("pointerdown", onDown);
    return () => window.removeEventListener("pointerdown", onDown);
  }, [menuOpen]);

  // Focus follows the menu open, so the keyboard lands where the eye does.
  useEffect(() => {
    if (!menuOpen) return;
    menuRef.current?.querySelector<HTMLElement>('[role="menuitem"]')?.focus();
  }, [menuOpen]);

  const itemProps = useRovingTabIndex(2, activeItem, setActiveItem, {
    orientation: "vertical",
  });

  const previews = objects.slice(0, 8);

  return (
    <div
      className="group relative flex flex-col overflow-hidden rounded-xl border border-border-hair p-4 transition-[border-color,box-shadow] duration-200 hover:border-border-strong hover:shadow-[0_4px_40px_-12px_var(--glow)]"
      style={
        {
          gridColumn: `${room.position.x + 1} / span ${room.position.w}`,
          gridRow: `${room.position.y + 1} / span ${room.position.h}`,
          backgroundColor: paletteTint(room.palette, "wash"),
          boxShadow: `inset 3px 0 0 0 ${color}`,
          ["--glow" as string]: paletteTint(room.palette, "glow"),
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
          style={{ backgroundColor: paletteTint(room.palette, "chip"), color }}
        >
          <RoomIcon name={room.icon} size={18} strokeWidth={1.75} />
        </span>
        <h3 className="font-display text-lg leading-tight text-text">
          {room.name}
        </h3>
        <p className="mt-1 line-clamp-2 text-xs text-muted">
          {room.description}
        </p>
        <span className="mt-auto pt-2 text-xs tracking-wide text-muted">
          {objects.length} {objects.length === 1 ? "object" : "objects"}
        </span>
      </div>

      {/* Context menu */}
      <div ref={menuRef} className="absolute top-2 right-2 z-10">
        <button
          ref={triggerRef}
          type="button"
          onClick={() => {
            setActiveItem(0);
            setMenuOpen((v) => !v);
          }}
          aria-label={`Actions for ${room.name}`}
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          className="flex h-7 w-7 items-center justify-center rounded-md text-muted opacity-0 transition-[opacity,background-color,color] duration-200 group-hover:opacity-100 focus-visible:opacity-100 hover:bg-surface-2 hover:text-text"
        >
          <MoreVertical size={15} strokeWidth={1.75} />
        </button>
        {menuOpen ? (
          <div
            role="menu"
            className="motion-menu-in absolute top-8 right-0 w-36 overflow-hidden rounded-lg border border-border-strong bg-surface shadow-[0_12px_40px_-8px_rgba(0,0,0,0.7)]"
          >
            <button
              type="button"
              role="menuitem"
              {...itemProps(0)}
              onClick={() => {
                setMenuOpen(false);
                onEdit();
              }}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-text transition-colors hover:bg-surface-2 focus-visible:bg-surface-2"
            >
              <Pencil size={14} strokeWidth={1.75} /> Edit room
            </button>
            <button
              type="button"
              role="menuitem"
              {...itemProps(1)}
              onClick={() => {
                setMenuOpen(false);
                onDelete();
              }}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-danger transition-colors hover:bg-surface-2 focus-visible:bg-surface-2"
            >
              <Trash2 size={14} strokeWidth={1.75} /> Delete room
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
