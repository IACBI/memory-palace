"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  forceSimulation,
  forceLink,
  forceManyBody,
  forceCenter,
  forceCollide,
  type Simulation,
  type SimulationNodeDatum,
  type SimulationLinkDatum,
} from "d3-force";
import { usePalaceStore } from "@/lib/store";
import { paletteColor } from "@/lib/palette";
import type { KnowledgeObject, Room } from "@/lib/types";

const WIDTH = 960;
const HEIGHT = 640;

interface GNode extends SimulationNodeDatum {
  id: string;
  title: string;
  roomId: string;
  degree: number;
}

interface GLink extends SimulationLinkDatum<GNode> {
  id: string;
  label?: string;
}

interface Transform {
  x: number;
  y: number;
  k: number;
}

function clamp(v: number, min: number, max: number) {
  return Math.min(max, Math.max(min, v));
}

export function GraphView({
  objects,
  rooms,
  connections,
}: {
  objects: KnowledgeObject[];
  rooms: Room[];
  connections: { id: string; fromId: string; toId: string; label?: string }[];
}) {
  const openObject = usePalaceStore((s) => s.openObject);

  const svgRef = useRef<SVGSVGElement>(null);
  const nodesRef = useRef<GNode[]>([]);
  const simRef = useRef<Simulation<GNode, GLink> | null>(null);
  const roamRef = useRef<{ startX: number; startY: number; ox: number; oy: number } | null>(null);
  const dragRef = useRef<{ id: string; moved: boolean } | null>(null);

  const [frame, setFrame] = useState<{ nodes: GNode[]; links: GLink[] }>({
    nodes: [],
    links: [],
  });
  const [hovered, setHovered] = useState<string | null>(null);
  const [focusRooms, setFocusRooms] = useState<Set<string>>(new Set());
  const [transform, setTransform] = useState<Transform>({ x: 0, y: 0, k: 1 });

  const roomById = useMemo(() => new Map(rooms.map((r) => [r.id, r])), [rooms]);

  // Neighbor adjacency for hover highlighting.
  const neighbors = useMemo(() => {
    const map = new Map<string, Set<string>>();
    for (const c of connections) {
      if (!map.has(c.fromId)) map.set(c.fromId, new Set());
      if (!map.has(c.toId)) map.set(c.toId, new Set());
      map.get(c.fromId)!.add(c.toId);
      map.get(c.toId)!.add(c.fromId);
    }
    return map;
  }, [connections]);

  // Build & run the force simulation whenever the data changes.
  useEffect(() => {
    const ids = new Set(objects.map((o) => o.id));
    const degree = new Map<string, number>();
    for (const c of connections) {
      if (ids.has(c.fromId) && ids.has(c.toId)) {
        degree.set(c.fromId, (degree.get(c.fromId) ?? 0) + 1);
        degree.set(c.toId, (degree.get(c.toId) ?? 0) + 1);
      }
    }

    const prev = new Map(nodesRef.current.map((n) => [n.id, n]));
    const nodes: GNode[] = objects.map((o) => {
      const existing = prev.get(o.id);
      return {
        id: o.id,
        title: o.title,
        roomId: o.roomId,
        degree: degree.get(o.id) ?? 0,
        x: existing?.x ?? WIDTH / 2 + (Math.random() - 0.5) * 200,
        y: existing?.y ?? HEIGHT / 2 + (Math.random() - 0.5) * 200,
      };
    });
    const links: GLink[] = connections
      .filter((c) => ids.has(c.fromId) && ids.has(c.toId))
      .map((c) => ({ id: c.id, source: c.fromId, target: c.toId, label: c.label }));

    nodesRef.current = nodes;

    const sim = forceSimulation<GNode>(nodes)
      .force(
        "link",
        forceLink<GNode, GLink>(links)
          .id((d) => d.id)
          .distance(80)
          .strength(0.4),
      )
      .force("charge", forceManyBody<GNode>().strength(-220))
      .force("center", forceCenter(WIDTH / 2, HEIGHT / 2))
      .force("collide", forceCollide<GNode>().radius((d) => 10 + d.degree * 2))
      .on("tick", () => setFrame({ nodes: [...nodes], links }));

    simRef.current = sim;

    // Pre-settle the layout synchronously (independent of requestAnimationFrame,
    // which can be suspended in background tabs) so the graph paints immediately.
    // The live tick handler above still drives animation while a node is dragged.
    sim.stop();
    for (let i = 0; i < 300; i += 1) sim.tick();

    // Seed via a timer so we never call setState synchronously in the effect body.
    const seed = setTimeout(() => setFrame({ nodes: [...nodes], links }), 0);
    return () => {
      clearTimeout(seed);
      sim.stop();
    };
  }, [objects, connections]);

  const { nodes, links } = frame;

  const screenToSim = (clientX: number, clientY: number) => {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const ctm = svg.getScreenCTM();
    if (!ctm) return { x: 0, y: 0 };
    const pt = new DOMPoint(clientX, clientY).matrixTransform(ctm.inverse());
    return { x: (pt.x - transform.x) / transform.k, y: (pt.y - transform.y) / transform.k };
  };

  // --- Node dragging ---
  const onNodePointerDown = (e: React.PointerEvent, node: GNode) => {
    e.stopPropagation();
    (e.target as Element).setPointerCapture?.(e.pointerId);
    dragRef.current = { id: node.id, moved: false };
    node.fx = node.x;
    node.fy = node.y;
    simRef.current?.alphaTarget(0.3).restart();
  };
  const onNodePointerMove = (e: React.PointerEvent, node: GNode) => {
    if (dragRef.current?.id !== node.id) return;
    dragRef.current.moved = true;
    const p = screenToSim(e.clientX, e.clientY);
    node.fx = p.x;
    node.fy = p.y;
  };
  const onNodePointerUp = (e: React.PointerEvent, node: GNode) => {
    if (dragRef.current?.id !== node.id) return;
    const wasDrag = dragRef.current.moved;
    dragRef.current = null;
    node.fx = null;
    node.fy = null;
    simRef.current?.alphaTarget(0);
    if (!wasDrag) openObject(node.id);
  };

  // --- Pan & zoom ---
  const onBgPointerDown = (e: React.PointerEvent) => {
    roamRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      ox: transform.x,
      oy: transform.y,
    };
    (e.currentTarget as Element).setPointerCapture?.(e.pointerId);
  };
  const onBgPointerMove = (e: React.PointerEvent) => {
    if (!roamRef.current) return;
    const svg = svgRef.current;
    const scale = svg ? WIDTH / svg.getBoundingClientRect().width : 1;
    setTransform((t) => ({
      ...t,
      x: roamRef.current!.ox + (e.clientX - roamRef.current!.startX) * scale,
      y: roamRef.current!.oy + (e.clientY - roamRef.current!.startY) * scale,
    }));
  };
  const onBgPointerUp = () => {
    roamRef.current = null;
  };
  const onWheel = (e: React.WheelEvent) => {
    const svg = svgRef.current;
    if (!svg) return;
    const ctm = svg.getScreenCTM();
    if (!ctm) return;
    const pt = new DOMPoint(e.clientX, e.clientY).matrixTransform(ctm.inverse());
    const factor = e.deltaY < 0 ? 1.12 : 1 / 1.12;
    setTransform((t) => {
      const k = clamp(t.k * factor, 0.4, 3);
      return {
        k,
        x: pt.x - ((pt.x - t.x) / t.k) * k,
        y: pt.y - ((pt.y - t.y) / t.k) * k,
      };
    });
  };

  const toggleRoom = (roomId: string) =>
    setFocusRooms((prev) => {
      const next = new Set(prev);
      if (next.has(roomId)) next.delete(roomId);
      else next.add(roomId);
      return next;
    });

  const nodeById = new Map(nodes.map((n) => [n.id, n]));
  const activeSet = hovered
    ? new Set<string>([hovered, ...(neighbors.get(hovered) ?? [])])
    : null;

  const isDimmed = (node: GNode): boolean => {
    if (focusRooms.size > 0 && !focusRooms.has(node.roomId)) return true;
    if (activeSet && !activeSet.has(node.id)) return true;
    return false;
  };

  return (
    <div className="flex flex-col gap-4 lg:flex-row">
      <div className="relative flex-1 overflow-hidden rounded-2xl border border-border-hair bg-surface/40">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          className="h-[70vh] w-full touch-none select-none"
          onPointerDown={onBgPointerDown}
          onPointerMove={onBgPointerMove}
          onPointerUp={onBgPointerUp}
          onWheel={onWheel}
          role="application"
          aria-label="Knowledge graph"
        >
          <g transform={`translate(${transform.x},${transform.y}) scale(${transform.k})`}>
            {/* Links */}
            {links.map((link) => {
              const s = typeof link.source === "object" ? (link.source as GNode) : nodeById.get(String(link.source));
              const t = typeof link.target === "object" ? (link.target as GNode) : nodeById.get(String(link.target));
              if (!s || !t) return null;
              const dim =
                (activeSet && !(activeSet.has(s.id) && activeSet.has(t.id))) ||
                (focusRooms.size > 0 &&
                  !(focusRooms.has(s.roomId) || focusRooms.has(t.roomId)));
              const isHoverLink =
                hovered && (s.id === hovered || t.id === hovered);
              return (
                <g key={link.id}>
                  <line
                    x1={s.x}
                    y1={s.y}
                    x2={t.x}
                    y2={t.y}
                    stroke="var(--palace-border-strong)"
                    strokeWidth={isHoverLink ? 1.6 : 1}
                    opacity={dim ? 0.08 : 0.5}
                  />
                  {isHoverLink && link.label ? (
                    <text
                      x={(s.x! + t.x!) / 2}
                      y={(s.y! + t.y!) / 2 - 4}
                      textAnchor="middle"
                      className="fill-[var(--palace-muted)] text-[9px]"
                    >
                      {link.label}
                    </text>
                  ) : null}
                </g>
              );
            })}

            {/* Nodes */}
            {nodes.map((node) => {
              const room = roomById.get(node.roomId);
              const color = room ? paletteColor(room.palette) : "var(--palace-muted)";
              const r = 6 + node.degree * 2;
              const dim = isDimmed(node);
              const unconnected = node.degree === 0;
              return (
                <g
                  key={node.id}
                  transform={`translate(${node.x},${node.y})`}
                  className="cursor-pointer"
                  onPointerDown={(e) => onNodePointerDown(e, node)}
                  onPointerMove={(e) => onNodePointerMove(e, node)}
                  onPointerUp={(e) => onNodePointerUp(e, node)}
                  onMouseEnter={() => setHovered(node.id)}
                  onMouseLeave={() => setHovered((h) => (h === node.id ? null : h))}
                  opacity={dim ? 0.18 : unconnected ? 0.55 : 1}
                >
                  <circle
                    r={r}
                    fill={color}
                    stroke={hovered === node.id ? "var(--palace-text)" : "var(--palace-base)"}
                    strokeWidth={hovered === node.id ? 2 : 1.5}
                  />
                  {hovered === node.id ? (
                    <text
                      x={r + 5}
                      y={4}
                      className="fill-[var(--palace-text)] text-[11px]"
                      style={{ paintOrder: "stroke", stroke: "var(--palace-base)", strokeWidth: 3 }}
                    >
                      {node.title}
                    </text>
                  ) : null}
                </g>
              );
            })}
          </g>
        </svg>

        <div className="pointer-events-none absolute bottom-3 left-3 text-[11px] text-muted">
          Scroll to zoom · drag background to pan · drag a node to move
        </div>
      </div>

      {/* Legend */}
      <aside className="w-full shrink-0 lg:w-56">
        <h2 className="mb-3 font-display text-lg tracking-wide text-text">Rooms</h2>
        <ul className="space-y-1">
          {rooms.map((room) => {
            const color = paletteColor(room.palette);
            const active = focusRooms.has(room.id);
            const count = objects.filter((o) => o.roomId === room.id).length;
            return (
              <li key={room.id}>
                <button
                  type="button"
                  onClick={() => toggleRoom(room.id)}
                  aria-pressed={active}
                  className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-sm transition-colors ${
                    active ? "bg-surface-2 text-text" : "text-muted hover:bg-surface-2/60 hover:text-text"
                  }`}
                >
                  <span
                    className="h-3 w-3 shrink-0 rounded-full"
                    style={{ backgroundColor: color }}
                    aria-hidden
                  />
                  <span className="min-w-0 flex-1 truncate">{room.name}</span>
                  <span className="shrink-0 text-xs text-muted">{count}</span>
                </button>
              </li>
            );
          })}
        </ul>
        {focusRooms.size > 0 ? (
          <button
            type="button"
            onClick={() => setFocusRooms(new Set())}
            className="mt-2 px-2.5 text-xs text-muted transition-colors hover:text-text"
          >
            Clear highlight
          </button>
        ) : null}
      </aside>
    </div>
  );
}
