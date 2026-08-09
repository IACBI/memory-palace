"use client";

import { useRef, useState } from "react";
import { Pin, ExternalLink } from "lucide-react";
import type { KnowledgeObject, PaletteKey } from "@/lib/types";
import { OBJECT_TYPE_META } from "@/lib/object-meta";
import { paletteColor, paletteTint } from "@/lib/palette";
import { usePalaceStore } from "@/lib/store";
import { cn } from "@/lib/cn";

const DRAG_THRESHOLD = 4; // px before a press becomes a drag
const CARD_WIDTH = 180;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function ObjectCard({
  object,
  palette,
  canvas,
  instructionsId,
  linking,
  isLinkSource,
  onOpen,
  onRequestDelete,
  onStartLink,
  onLinkTo,
  onCancelLink,
}: {
  object: KnowledgeObject;
  /** The owning room's palette, used to tint the card. */
  palette: PaletteKey;
  /** The canvas element, for converting pointer positions to percentages. */
  canvas: HTMLElement | null;
  /** Id of the canvas-level element describing the keyboard controls. */
  instructionsId: string;
  /** Whether a link is currently being drawn from some card. */
  linking: boolean;
  /** Whether that card is this one. */
  isLinkSource: boolean;
  onOpen: (id: string) => void;
  onRequestDelete: (object: KnowledgeObject) => void;
  /** Begin drawing a link from this card, optionally following the pointer. */
  onStartLink: (id: string, pointer?: { x: number; y: number }) => void;
  /** Finish a link at this card. */
  onLinkTo: (id: string) => void;
  onCancelLink: () => void;
}) {
  const moveObject = usePalaceStore((s) => s.moveObject);
  const accent = paletteColor(palette);

  /**
   * A drag is expressed as a pixel offset, not as a new percentage position.
   *
   * `left`/`top` are layout properties: writing them on every pointer move
   * forced a layout and repaint each frame. The card stays anchored at its
   * committed position and rides a `transform` instead, which the compositor
   * can handle on its own.
   */
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number } | null>(
    null,
  );
  const startRef = useRef<{ x: number; y: number } | null>(null);
  const movedRef = useRef(false);

  const dragging = dragOffset !== null;
  const pos = object.position;

  const meta = OBJECT_TYPE_META[object.type];
  const Glyph = meta.icon;
  const visibleTags = object.tags.slice(0, 2);
  const overflow = object.tags.length - visibleTags.length;

  const pointToPercent = (clientX: number, clientY: number) => {
    const rect = canvas?.getBoundingClientRect();
    if (!rect) return pos;
    return {
      x: clamp(((clientX - rect.left) / rect.width) * 100, 3, 97),
      y: clamp(((clientY - rect.top) / rect.height) * 100, 3, 97),
    };
  };

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    startRef.current = { x: e.clientX, y: e.clientY };
    movedRef.current = false;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!startRef.current) return;
    const dx = e.clientX - startRef.current.x;
    const dy = e.clientY - startRef.current.y;
    if (!movedRef.current && Math.hypot(dx, dy) < DRAG_THRESHOLD) return;
    movedRef.current = true;
    setDragOffset({ x: dx, y: dy });
  };

  const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (startRef.current) {
      (e.currentTarget as HTMLElement).releasePointerCapture?.(e.pointerId);
    }
    startRef.current = null;
    if (movedRef.current) {
      const next = pointToPercent(e.clientX, e.clientY);
      moveObject(object.id, next);
    }
    setDragOffset(null);
  };

  const nudge = (dx: number, dy: number) => {
    const next = {
      x: clamp(pos.x + dx, 3, 97),
      y: clamp(pos.y + dy, 3, 97),
    };
    moveObject(object.id, next);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const step = e.shiftKey ? 5 : 2;

    // While a link is being drawn, Enter lands it here rather than opening the
    // editor — otherwise finishing a link by keyboard is impossible.
    if (e.key.toLowerCase() === "l") {
      e.preventDefault();
      if (!linking) onStartLink(object.id);
      else if (isLinkSource) onCancelLink();
      else onLinkTo(object.id);
      return;
    }
    if (linking && (e.key === "Enter" || e.key === " ")) {
      e.preventDefault();
      if (isLinkSource) onCancelLink();
      else onLinkTo(object.id);
      return;
    }

    switch (e.key) {
      case "ArrowUp":
        e.preventDefault();
        nudge(0, -step);
        break;
      case "ArrowDown":
        e.preventDefault();
        nudge(0, step);
        break;
      case "ArrowLeft":
        e.preventDefault();
        nudge(-step, 0);
        break;
      case "ArrowRight":
        e.preventDefault();
        nudge(step, 0);
        break;
      case "Enter":
      case " ":
        e.preventDefault();
        onOpen(object.id);
        break;
      case "Delete":
      case "Backspace":
        e.preventDefault();
        onRequestDelete(object);
        break;
      default:
        break;
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      // Name stays stable so nudging the card does not re-announce the whole
      // sentence on every arrow press; the live position and the instructions
      // are described separately.
      aria-label={`${object.title}, ${meta.label}`}
      aria-describedby={instructionsId}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onKeyDown={onKeyDown}
      data-object-id={object.id}
      onClick={() => {
        if (movedRef.current) return;
        if (linking && !isLinkSource) onLinkTo(object.id);
        else if (linking) onCancelLink();
        else onOpen(object.id);
      }}
      className={cn(
        "group absolute touch-none rounded-lg border bg-surface p-3 transition-shadow duration-150 select-none focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2",
        dragging
          ? "z-[var(--z-sticky)] cursor-grabbing shadow-overlay"
          : "z-[var(--z-raised)] cursor-grab shadow-raise hover:shadow-[0_8px_36px_-12px_var(--glow)]",
        isLinkSource && "ring-2 ring-accent",
        linking && !isLinkSource && "cursor-crosshair ring-1 ring-accent-dim",
      )}
      style={
        {
          left: `${pos.x}%`,
          top: `${pos.y}%`,
          width: CARD_WIDTH,
          // The drag offset rides here rather than in left/top: transform is
          // composited, layout properties are not.
          transform: dragOffset
            ? `translate(calc(-50% + ${dragOffset.x}px), calc(-50% + ${dragOffset.y}px)) scale(1.03)`
            : "translate(-50%, -50%) scale(1)",
          borderColor: paletteTint(palette, "edge"),
          ["--glow" as string]: paletteTint(palette, "glow"),
        } as React.CSSProperties
      }
    >
      {/*
        The link handle: a pointer affordance, not a control.

        The card is already `role="button"`, and nesting a real button inside
        one is `nested-interactive` — the two names collide and a screen reader
        cannot tell which is which. Keyboard users reach the same behaviour
        through the L key, which the canvas instructions describe, so this
        stays hidden from the accessibility tree and handles pointers only.

        It is permanently visible on a touch screen: `group-hover` never fires
        there, which left drawing a link mouse-only.
      */}
      <span
        aria-hidden
        data-link-handle
        onPointerDown={(e) => {
          e.stopPropagation();
          e.preventDefault();
          onStartLink(object.id, { x: e.clientX, y: e.clientY });
        }}
        className="absolute top-1/2 -right-3 z-[var(--z-drawer)] flex h-6 w-6 -translate-y-1/2 cursor-crosshair items-center justify-center rounded-full border border-border-strong bg-surface transition-opacity group-focus-within:opacity-100 group-hover:opacity-100 md:opacity-0"
      >
        <span
          className="h-1.5 w-1.5 rounded-full"
          style={{ backgroundColor: accent }}
        />
      </span>

      <div className="flex items-center justify-between gap-2">
        <span
          className="flex h-6 w-6 items-center justify-center rounded-sm"
          style={{
            backgroundColor: paletteTint(palette, "chip"),
            color: accent,
          }}
        >
          <Glyph size={13} strokeWidth={1.75} aria-hidden />
        </span>
        <div className="flex items-center gap-1 text-muted">
          {object.url ? (
            <ExternalLink size={12} strokeWidth={1.75} aria-hidden />
          ) : null}
          {object.pinned ? (
            <Pin
              size={12}
              strokeWidth={1.75}
              className="text-accent"
              aria-hidden
            />
          ) : null}
        </div>
      </div>
      <h4 className="mt-2 line-clamp-2 font-display text-sm leading-tight font-medium text-text">
        {object.title}
      </h4>
      {(visibleTags.length > 0 || overflow > 0) && (
        <div className="mt-2 flex flex-wrap items-center gap-1">
          {visibleTags.map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-border-hair bg-surface-2 px-1.5 py-0.5 text-2xs text-muted"
            >
              {tag}
            </span>
          ))}
          {overflow > 0 ? (
            <span className="text-2xs text-muted">+{overflow}</span>
          ) : null}
        </div>
      )}
    </div>
  );
}
