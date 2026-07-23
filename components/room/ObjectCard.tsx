"use client";

import { useRef, useState, type RefObject } from "react";
import { Pin, ExternalLink } from "lucide-react";
import type { KnowledgeObject, ObjectPosition } from "@/lib/types";
import { OBJECT_TYPE_META } from "@/lib/object-meta";
import { usePalaceStore } from "@/lib/store";

const DRAG_THRESHOLD = 4; // px before a press becomes a drag
const CARD_WIDTH = 180;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function ObjectCard({
  object,
  accent,
  canvasRef,
  onOpen,
  onRequestDelete,
}: {
  object: KnowledgeObject;
  accent: string;
  canvasRef: RefObject<HTMLDivElement | null>;
  onOpen: (id: string) => void;
  onRequestDelete: (object: KnowledgeObject) => void;
}) {
  const moveObject = usePalaceStore((s) => s.moveObject);

  // While dragging we hold a transient position; otherwise the store is truth.
  const [dragPos, setDragPos] = useState<ObjectPosition | null>(null);
  const [dragging, setDragging] = useState(false);
  const startRef = useRef<{ x: number; y: number } | null>(null);
  const movedRef = useRef(false);

  const pos = dragPos ?? object.position;

  const meta = OBJECT_TYPE_META[object.type];
  const Glyph = meta.icon;
  const visibleTags = object.tags.slice(0, 2);
  const overflow = object.tags.length - visibleTags.length;

  const pointToPercent = (clientX: number, clientY: number) => {
    const rect = canvasRef.current?.getBoundingClientRect();
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
    if (!dragging) setDragging(true);
    setDragPos(pointToPercent(e.clientX, e.clientY));
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
    setDragPos(null);
    setDragging(false);
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
      aria-label={`${object.title}, ${meta.label}, at ${Math.round(
        pos.x,
      )} percent across and ${Math.round(
        pos.y,
      )} percent down. Enter to edit, arrow keys to move, Delete to remove.`}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onKeyDown={onKeyDown}
      onClick={() => {
        if (!movedRef.current) onOpen(object.id);
      }}
      className={`group absolute touch-none rounded-xl border bg-surface p-3 transition-shadow duration-150 select-none focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2 ${
        dragging
          ? "z-20 cursor-grabbing shadow-[0_18px_50px_-12px_rgba(0,0,0,0.75)]"
          : "z-10 cursor-grab shadow-[0_2px_16px_-8px_rgba(0,0,0,0.6)] hover:shadow-[0_8px_36px_-12px_var(--glow)]"
      }`}
      style={
        {
          left: `${pos.x}%`,
          top: `${pos.y}%`,
          width: CARD_WIDTH,
          transform: `translate(-50%, -50%) ${dragging ? "scale(1.03)" : "scale(1)"}`,
          borderColor: `${accent}55`,
          ["--glow" as string]: `${accent}66`,
        } as React.CSSProperties
      }
    >
      <div className="flex items-center justify-between gap-2">
        <span
          className="flex h-6 w-6 items-center justify-center rounded-md"
          style={{ backgroundColor: `${accent}26`, color: accent }}
        >
          <Glyph size={13} strokeWidth={1.75} />
        </span>
        <div className="flex items-center gap-1 text-muted">
          {object.url ? <ExternalLink size={12} strokeWidth={1.75} /> : null}
          {object.pinned ? (
            <Pin size={12} strokeWidth={1.75} className="text-accent" />
          ) : null}
        </div>
      </div>
      <h4 className="mt-2 line-clamp-2 font-display text-sm leading-tight text-text">
        {object.title}
      </h4>
      {(visibleTags.length > 0 || overflow > 0) && (
        <div className="mt-2 flex flex-wrap items-center gap-1">
          {visibleTags.map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-border-hair bg-surface-2 px-1.5 py-0.5 text-[10px] text-muted"
            >
              {tag}
            </span>
          ))}
          {overflow > 0 ? (
            <span className="text-[10px] text-muted">+{overflow}</span>
          ) : null}
        </div>
      )}
    </div>
  );
}
