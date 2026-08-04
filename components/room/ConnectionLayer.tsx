"use client";

import { memo } from "react";
import {
  linkMidpoint,
  linkPath,
  stubEnd,
  stubPath,
  toPixels,
  type CanvasSize,
  type Point,
} from "@/lib/canvas-links";
import { paletteColor, paletteTint } from "@/lib/palette";
import type { Connection, KnowledgeObject, PaletteKey } from "@/lib/types";

export interface LinkDraft {
  from: Point;
  to: Point;
}

/**
 * The curves joining connected objects, drawn beneath the cards.
 *
 * `aria-hidden`, deliberately. This is a second rendering of data that is
 * already presented as a list in the object editor, where every connection can
 * be reached, relabelled and removed with the keyboard. Making fifty curves
 * individually tabbable would add tab stops without adding a single thing a
 * keyboard user could not already do.
 */
export const ConnectionLayer = memo(function ConnectionLayer({
  connections,
  objectsById,
  size,
  palette,
  selectedId,
  draft,
  onSelect,
}: {
  /** Connections with at least one endpoint in this room. */
  connections: Connection[];
  objectsById: Map<string, KnowledgeObject>;
  size: CanvasSize;
  palette: PaletteKey;
  selectedId: string | null;
  /** The line following the pointer while a new link is being drawn. */
  draft: LinkDraft | null;
  onSelect: (id: string | null) => void;
}) {
  if (size.width === 0 || size.height === 0) return null;

  const colour = paletteColor(palette);

  return (
    <svg
      aria-hidden
      className="pointer-events-none absolute inset-0 h-full w-full overflow-visible"
      viewBox={`0 0 ${size.width} ${size.height}`}
      preserveAspectRatio="none"
    >
      {connections.map((connection) => {
        const from = objectsById.get(connection.fromId);
        const to = objectsById.get(connection.toId);

        // One endpoint lives in another room: draw where it leaves, not a line
        // to nowhere.
        const inRoom = from && to;
        const anchor = from ?? to;
        if (!anchor) return null;

        const start = toPixels(anchor.position, size);
        const selected = selectedId === connection.id;

        if (!inRoom) {
          const end = stubEnd(start, size);
          return (
            <g key={connection.id} opacity={0.5}>
              <path
                d={stubPath(start, size)}
                fill="none"
                stroke={colour}
                strokeWidth={selected ? 2.5 : 1.5}
                strokeDasharray="3 4"
                vectorEffect="non-scaling-stroke"
              />
              <circle cx={end.x} cy={end.y} r={2.5} fill={colour} />
            </g>
          );
        }

        const end = toPixels(to.position, size);
        const path = linkPath(start, end);
        const mid = linkMidpoint(start, end);

        return (
          <g key={connection.id}>
            {/* A wide invisible stroke gives the curve a clickable target;
                1.5px of visible line is nearly impossible to hit. */}
            <path
              d={path}
              fill="none"
              stroke="transparent"
              strokeWidth={16}
              vectorEffect="non-scaling-stroke"
              className="pointer-events-auto cursor-pointer"
              onClick={(event) => {
                event.stopPropagation();
                onSelect(selected ? null : connection.id);
              }}
            />
            <path
              d={path}
              fill="none"
              stroke={colour}
              strokeWidth={selected ? 2.5 : 1.5}
              strokeLinecap="round"
              opacity={selected ? 1 : 0.55}
              vectorEffect="non-scaling-stroke"
            />
            {connection.label ? (
              <text
                x={mid.x}
                y={mid.y}
                textAnchor="middle"
                dominantBaseline="middle"
                className="fill-muted text-[11px]"
                style={{
                  paintOrder: "stroke",
                  stroke: "var(--palace-base)",
                  strokeWidth: 4,
                  strokeLinejoin: "round",
                }}
              >
                {connection.label}
              </text>
            ) : null}
          </g>
        );
      })}

      {draft ? (
        <path
          d={linkPath(draft.from, draft.to)}
          fill="none"
          stroke={colour}
          strokeWidth={2}
          strokeDasharray="5 5"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />
      ) : null}

      {draft ? (
        <circle
          cx={draft.to.x}
          cy={draft.to.y}
          r={5}
          fill={paletteTint(palette, "chip")}
          stroke={colour}
          strokeWidth={1.5}
          vectorEffect="non-scaling-stroke"
        />
      ) : null}
    </svg>
  );
});
