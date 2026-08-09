"use client";

import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import { useRoomMap } from "@/lib/hooks/use-room-map";
import { useElementSize } from "@/lib/hooks/use-element-size";
import {
  forceSimulation,
  forceLink,
  forceManyBody,
  forceCenter,
  forceCollide,
  forceX,
  forceY,
  type Simulation,
  type SimulationNodeDatum,
  type SimulationLinkDatum,
} from "d3-force";
import { Maximize, Minus, Plus } from "lucide-react";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { usePalaceStore } from "@/lib/store";
import { graphSignature } from "@/lib/graph-key";
import {
  collisionRadius,
  hubCount,
  hubIds,
  nodeRadius,
} from "@/lib/graph-metrics";
import { linkPath } from "@/lib/canvas-links";
import { prefersReducedMotion } from "@/lib/prefs";
import { paletteColor } from "@/lib/palette";
import { cn } from "@/lib/cn";
import { IconButton } from "@/components/ui/IconButton";
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
  const roamRef = useRef<{
    startX: number;
    startY: number;
    ox: number;
    oy: number;
  } | null>(null);
  const dragRef = useRef<{ id: string; moved: boolean } | null>(null);
  const rafRef = useRef<number | null>(null);
  const helpId = useId();
  const nodeIdPrefix = useId();

  const [frame, setFrame] = useState<{ nodes: GNode[]; links: GLink[] }>({
    nodes: [],
    links: [],
  });
  const [hovered, setHovered] = useState<string | null>(null);
  const [cursorId, setCursorId] = useState<string | null>(null);
  const [neighbourCursor, setNeighbourCursor] = useState<string | null>(null);
  const [focusRooms, setFocusRooms] = useState<Set<string>>(new Set());
  const [transform, setTransform] = useState<Transform>({ x: 0, y: 0, k: 1 });

  const roomById = useRoomMap(rooms);

  /**
   * The drawing surface, measured.
   *
   * The SVG's user space is CSS pixels, and the `viewBox` is the measured box
   * centred on the simulation's origin. A fixed `viewBox` could not be: with
   * the default `preserveAspectRatio` a 960×640 box inside a wide, short
   * container is scaled to *fit*, so the whole graph was drawn at whatever
   * fraction the height allowed — about 79% on a laptop — and letterboxed with
   * dead space down both sides. Tracking the container instead means one node
   * is one size no matter the window, and the canvas is always full.
   */
  const { size: canvasSize, ref: canvasRef } = useElementSize<HTMLDivElement>();
  const view = {
    w: canvasSize.width > 0 ? canvasSize.width : WIDTH,
    h: canvasSize.height > 0 ? canvasSize.height : HEIGHT,
  };

  // Read by `fitToView` and the pan handler without either depending on the
  // measurement: `fitToView` is in the simulation effect's dependency list, so
  // a new identity on every resize would tear the layout down and re-run it.
  const viewRef = useRef(view);
  useEffect(() => {
    viewRef.current = view;
  });

  // Neighbour adjacency for hover highlighting.
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

  /**
   * The graph's *shape*: which nodes exist and what links them.
   *
   * The simulation effect keys off this rather than the arrays themselves.
   * The store replaces `objects` on every edit, so a single keystroke in the
   * object editor used to tear down and re-run the whole layout — including
   * hundreds of synchronous force ticks — while the user was typing.
   */
  const graphKey = useMemo(
    () => graphSignature(objects, connections),
    [objects, connections],
  );

  /** Titles are read at paint time, so renaming never re-runs the layout. */
  const titleById = useMemo(
    () => new Map(objects.map((o) => [o.id, o.title])),
    [objects],
  );

  // Counted once per data change rather than per room per render: the tick
  // handler re-renders this component on every animation frame while the
  // layout settles, and a scan per room per frame is rooms × objects of work
  // for a number that only changes when `objects` does.
  const objectCountByRoom = useMemo(() => {
    const counts = new Map<string, number>();
    for (const o of objects) {
      counts.set(o.roomId, (counts.get(o.roomId) ?? 0) + 1);
    }
    return counts;
  }, [objects]);

  // The simulation effect reads the latest data without depending on array
  // identity. Declared before that effect so it is already current when the
  // graph's shape changes — effects run in declaration order.
  const dataRef = useRef({ objects, connections });
  useEffect(() => {
    dataRef.current = { objects, connections };
  });

  /**
   * Frames every node.
   *
   * A force layout has no obligation to stay inside the box it started in —
   * disconnected clusters repel each other indefinitely — so a graph could
   * settle with half its nodes past the top edge and nothing to suggest they
   * were there. Fitting after the layout settles makes "everything is on
   * screen" a property of the view rather than a hope about the physics.
   */
  const fitToView = useCallback(() => {
    const settled = nodesRef.current;
    if (settled.length === 0) return;

    const padding = 48;
    const xs = settled.map((node) => node.x ?? 0);
    const ys = settled.map((node) => node.y ?? 0);
    const minX = Math.min(...xs) - padding;
    const maxX = Math.max(...xs) + padding;
    const minY = Math.min(...ys) - padding;
    const maxY = Math.max(...ys) + padding;

    const { w: viewW, h: viewH } = viewRef.current;
    const k = clamp(
      Math.min(
        viewW / Math.max(1, maxX - minX),
        viewH / Math.max(1, maxY - minY),
      ),
      0.4,
      2,
    );
    setTransform({
      k,
      x: WIDTH / 2 - ((minX + maxX) / 2) * k,
      y: HEIGHT / 2 - ((minY + maxY) / 2) * k,
    });
  }, []);

  // Build & run the force simulation whenever the graph's shape changes.
  useEffect(() => {
    const { objects, connections } = dataRef.current;
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
      .map((c) => ({
        id: c.id,
        source: c.fromId,
        target: c.toId,
        label: c.label,
      }));

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
      .force(
        "collide",
        forceCollide<GNode>().radius((d) => collisionRadius(d.degree)),
      )
      // `forceCenter` only translates the centre of mass; it exerts no pull on
      // any individual node. Without these, an object with no connections is
      // pushed outward by charge and nothing ever pushes back, so a palace with
      // a few unlinked notes settled into a scatter spanning several screens.
      .force("gatherX", forceX<GNode>(WIDTH / 2).strength(0.06))
      .force("gatherY", forceY<GNode>(HEIGHT / 2).strength(0.06))
      // Coalesced to one state update per animation frame. d3 ticks faster
      // than the browser paints, so a setState per tick re-rendered every node
      // and link several times for a single visible frame.
      .on("tick", () => {
        if (rafRef.current !== null) return;
        rafRef.current = requestAnimationFrame(() => {
          rafRef.current = null;
          setFrame({ nodes: [...nodes], links });
        });
      });

    simRef.current = sim;

    // Pre-settle the layout synchronously (independent of requestAnimationFrame,
    // which can be suspended in background tabs) so the graph paints immediately.
    // The live tick handler above still drives animation while a node is dragged.
    // Scaled to the node count: a six-object palace does not need 300 ticks,
    // and a large one should not pay for them on the main thread.
    //
    // With motion allowed, only most of that work happens up front and the
    // last of it plays out on screen: the graph arrives nearly arranged and
    // visibly finds its shape, which reads as a map assembling itself rather
    // than a diagram that was always there. Under reduced motion it is fully
    // settled before the first paint and never moves.
    const reduced = prefersReducedMotion();
    sim.stop();
    const settled = Math.min(300, 60 + nodes.length * 4);
    const preTicks = reduced ? settled : Math.round(settled * 0.65);
    for (let i = 0; i < preTicks; i += 1) sim.tick();

    // Seed via a timer so we never call setState synchronously in the effect body.
    const seed = setTimeout(() => {
      setFrame({ nodes: [...nodes], links });
      fitToView();
    }, 0);

    if (!reduced) {
      // Decays to rest in roughly a second; d3's default would take four.
      sim.alphaDecay(0.08).alpha(0.25).restart();
      // Re-framed once the layout stops moving, not on every later restart —
      // refitting after each node drag would yank the view around.
      let framed = false;
      sim.on("end", () => {
        if (framed) return;
        framed = true;
        fitToView();
      });
    }
    return () => {
      clearTimeout(seed);
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      sim.stop();
    };
  }, [graphKey, fitToView]);

  const { nodes, links } = frame;

  /**
   * The nodes whose names stay on screen without hovering.
   *
   * A graph where nothing is named until you point at it is decoration; naming
   * everything is noise. The hubs are what let a reader orient.
   */
  const hubs = useMemo(() => hubIds(nodes, hubCount(nodes.length)), [nodes]);

  const screenToSim = (clientX: number, clientY: number) => {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const ctm = svg.getScreenCTM();
    if (!ctm) return { x: 0, y: 0 };
    const pt = new DOMPoint(clientX, clientY).matrixTransform(ctm.inverse());
    return {
      x: (pt.x - transform.x) / transform.k,
      y: (pt.y - transform.y) / transform.k,
    };
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
    // Read the roam out of the ref *here* rather than inside the updater. The
    // guard above runs now, but the updater runs later, during render — and
    // `onBgPointerUp` clears the ref in between often enough that panning to
    // the very edge of the canvas threw `null.ox` and dropped the whole graph
    // into the error boundary.
    const roam = roamRef.current;
    if (!roam) return;
    const svg = svgRef.current;
    const scale = svg
      ? viewRef.current.w / svg.getBoundingClientRect().width
      : 1;
    setTransform((t) => ({
      ...t,
      x: roam.ox + (e.clientX - roam.startX) * scale,
      y: roam.oy + (e.clientY - roam.startY) * scale,
    }));
  };
  const onBgPointerUp = () => {
    roamRef.current = null;
  };
  /**
   * Zoom is bound to Ctrl/Cmd + wheel, the platform convention; a plain wheel
   * scrolls the page as it does everywhere else.
   *
   * Attached natively because React registers `wheel` passively at the root,
   * where `preventDefault()` is silently ignored — so the old handler zoomed
   * the graph *and* scrolled the page past it at the same time.
   */
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;

    const onWheel = (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      const ctm = svg.getScreenCTM();
      if (!ctm) return;
      const pt = new DOMPoint(e.clientX, e.clientY).matrixTransform(
        ctm.inverse(),
      );
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

    svg.addEventListener("wheel", onWheel, { passive: false });
    return () => svg.removeEventListener("wheel", onWheel);
  }, []);

  const toggleRoom = (roomId: string) =>
    setFocusRooms((prev) => {
      const next = new Set(prev);
      if (next.has(roomId)) next.delete(roomId);
      else next.add(roomId);
      return next;
    });

  const nodeById = useMemo(() => new Map(nodes.map((n) => [n.id, n])), [nodes]);

  /**
   * Traversal order for the keyboard, grouped by room then title.
   *
   * Deliberately not the simulation's node order: that is seeded randomly, so
   * "next node" would mean something different on every visit.
   */
  const orderedIds = useMemo(
    () =>
      [...nodes]
        .sort((a, b) => {
          const roomA = roomById.get(a.roomId)?.name ?? "";
          const roomB = roomById.get(b.roomId)?.name ?? "";
          return (
            roomA.localeCompare(roomB) ||
            (titleById.get(a.id) ?? "").localeCompare(titleById.get(b.id) ?? "")
          );
        })
        .map((n) => n.id),
    [nodes, roomById, titleById],
  );

  /**
   * The node under the pointer *or* under the keyboard cursor.
   *
   * Merged deliberately: neighbour highlighting and dimming used to be
   * mouse-only, so a keyboard user got no equivalent of hovering.
   */
  const activeId = cursorId ?? hovered;
  const activeSet = activeId
    ? new Set<string>([activeId, ...(neighbors.get(activeId) ?? [])])
    : null;

  const isDimmed = (node: GNode): boolean => {
    if (focusRooms.size > 0 && !focusRooms.has(node.roomId)) return true;
    if (activeSet && !activeSet.has(node.id)) return true;
    return false;
  };

  /** Centres the view on a node, mirroring what hover gives a sighted user. */
  const centreOn = useCallback((node: GNode | undefined) => {
    if (!node || node.x === undefined || node.y === undefined) return;
    setTransform((t) => ({
      ...t,
      x: WIDTH / 2 - node.x! * t.k,
      y: HEIGHT / 2 - node.y! * t.k,
    }));
  }, []);

  const moveCursor = useCallback(
    (delta: number) => {
      if (orderedIds.length === 0) return;
      const current = cursorId ? orderedIds.indexOf(cursorId) : -1;
      const next =
        (((current + delta) % orderedIds.length) + orderedIds.length) %
        orderedIds.length;
      const id = orderedIds[next];
      setCursorId(id);
      centreOn(nodeById.get(id));
    },
    [orderedIds, cursorId, nodeById, centreOn],
  );

  /** Steps around the neighbours of the node the cursor is on. */
  const moveToNeighbour = useCallback(
    (delta: number) => {
      if (!cursorId) return moveCursor(delta);
      const around = [...(neighbors.get(cursorId) ?? [])].sort((a, b) =>
        (titleById.get(a) ?? "").localeCompare(titleById.get(b) ?? ""),
      );
      if (around.length === 0) return;
      const current = around.indexOf(neighbourCursor ?? "");
      const next =
        (((current + delta) % around.length) + around.length) % around.length;
      const id = around[next];
      setNeighbourCursor(id);
      setCursorId(id);
      centreOn(nodeById.get(id));
    },
    [
      cursorId,
      neighbors,
      titleById,
      neighbourCursor,
      nodeById,
      centreOn,
      moveCursor,
    ],
  );

  const zoomBy = useCallback((factor: number) => {
    setTransform((t) => {
      const k = clamp(t.k * factor, 0.4, 3);
      const cx = WIDTH / 2;
      const cy = HEIGHT / 2;
      return {
        k,
        x: cx - ((cx - t.x) / t.k) * k,
        y: cy - ((cy - t.y) / t.k) * k,
      };
    });
  }, []);

  const onSvgKeyDown = (event: React.KeyboardEvent) => {
    const pan = event.shiftKey ? 80 : 0;
    switch (event.key) {
      case "ArrowRight":
        event.preventDefault();
        if (pan) setTransform((t) => ({ ...t, x: t.x - pan }));
        else moveCursor(1);
        break;
      case "ArrowLeft":
        event.preventDefault();
        if (pan) setTransform((t) => ({ ...t, x: t.x + pan }));
        else moveCursor(-1);
        break;
      case "ArrowDown":
        event.preventDefault();
        if (pan) setTransform((t) => ({ ...t, y: t.y - pan }));
        else moveToNeighbour(1);
        break;
      case "ArrowUp":
        event.preventDefault();
        if (pan) setTransform((t) => ({ ...t, y: t.y + pan }));
        else moveToNeighbour(-1);
        break;
      case "Enter":
      case " ":
        if (!cursorId) break;
        event.preventDefault();
        openObject(cursorId);
        break;
      case "Escape":
        setCursorId(null);
        setNeighbourCursor(null);
        break;
      case "+":
      case "=":
        event.preventDefault();
        zoomBy(1.2);
        break;
      case "-":
        event.preventDefault();
        zoomBy(1 / 1.2);
        break;
      case "0":
        event.preventDefault();
        fitToView();
        break;
      default:
        break;
    }
  };

  /** What the live region reads out as the cursor moves. */
  const cursorAnnouncement = (() => {
    if (!cursorId) return "";
    const node = nodeById.get(cursorId);
    if (!node) return "";
    const position = orderedIds.indexOf(cursorId) + 1;
    const room = roomById.get(node.roomId)?.name ?? "Unassigned";
    const links = node.degree;
    return `${titleById.get(cursorId) ?? node.title}. ${room}. ${links} ${
      links === 1 ? "connection" : "connections"
    }. Node ${position} of ${orderedIds.length}.`;
  })();

  return (
    <div className="flex flex-col gap-4 lg:flex-row">
      <div
        ref={canvasRef}
        className="relative min-w-0 flex-1 overflow-hidden rounded-xl border border-border-hair bg-surface/40"
      >
        <svg
          ref={svgRef}
          viewBox={`${WIDTH / 2 - view.w / 2} ${HEIGHT / 2 - view.h / 2} ${view.w} ${view.h}`}
          className="h-[64vh] min-h-96 w-full touch-none select-none lg:h-[76vh]"
          onPointerDown={onBgPointerDown}
          onPointerMove={onBgPointerMove}
          onPointerUp={onBgPointerUp}
          onKeyDown={onSvgKeyDown}
          onBlur={() => setNeighbourCursor(null)}
          tabIndex={0}
          role="listbox"
          aria-label="Knowledge graph"
          aria-describedby={helpId}
          aria-activedescendant={
            cursorId ? `${nodeIdPrefix}-${cursorId}` : undefined
          }
        >
          <g
            transform={`translate(${transform.x},${transform.y}) scale(${transform.k})`}
          >
            {links.map((link) => {
              const s =
                typeof link.source === "object"
                  ? (link.source as GNode)
                  : nodeById.get(String(link.source));
              const t =
                typeof link.target === "object"
                  ? (link.target as GNode)
                  : nodeById.get(String(link.target));
              if (!s || !t) return null;
              const dim =
                (activeSet && !(activeSet.has(s.id) && activeSet.has(t.id))) ||
                (focusRooms.size > 0 &&
                  !(focusRooms.has(s.roomId) || focusRooms.has(t.roomId)));
              const isHoverLink =
                hovered && (s.id === hovered || t.id === hovered);
              return (
                <g key={link.id}>
                  {/* Curved, using the same helper as the room canvas: with
                      several links between the same cluster, straight chords
                      collapse into an unreadable star. */}
                  <path
                    d={linkPath(
                      { x: s.x ?? 0, y: s.y ?? 0 },
                      { x: t.x ?? 0, y: t.y ?? 0 },
                      0.09,
                    )}
                    fill="none"
                    stroke="var(--palace-border-strong)"
                    strokeWidth={isHoverLink ? 1.6 : 1}
                    strokeLinecap="round"
                    opacity={dim ? 0.08 : 0.5}
                  />
                  {isHoverLink && link.label ? (
                    <text
                      x={(s.x! + t.x!) / 2}
                      y={(s.y! + t.y!) / 2 - 4}
                      textAnchor="middle"
                      className="fill-[var(--palace-muted)] text-2xs"
                    >
                      {link.label}
                    </text>
                  ) : null}
                </g>
              );
            })}

            {nodes.map((node) => {
              const room = roomById.get(node.roomId);
              const color = room
                ? paletteColor(room.palette)
                : "var(--palace-muted)";
              const r = nodeRadius(node.degree);
              const dim = isDimmed(node);
              const unconnected = node.degree === 0;
              return (
                <g
                  key={node.id}
                  id={`${nodeIdPrefix}-${node.id}`}
                  role="option"
                  aria-selected={cursorId === node.id}
                  aria-label={`${titleById.get(node.id) ?? node.title}, ${
                    roomById.get(node.roomId)?.name ?? "Unassigned"
                  }, ${node.degree} ${
                    node.degree === 1 ? "connection" : "connections"
                  }`}
                  transform={`translate(${node.x},${node.y})`}
                  className="cursor-pointer"
                  onPointerDown={(e) => onNodePointerDown(e, node)}
                  onPointerMove={(e) => onNodePointerMove(e, node)}
                  onPointerUp={(e) => onNodePointerUp(e, node)}
                  onMouseEnter={() => setHovered(node.id)}
                  onMouseLeave={() =>
                    setHovered((h) => (h === node.id ? null : h))
                  }
                  opacity={dim ? 0.18 : unconnected ? 0.55 : 1}
                >
                  {/* Hubs cast a soft halo, so weight reads before you can
                      count the lines meeting at a node. */}
                  {hubs.has(node.id) ? (
                    <circle r={r * 2.4} fill={color} opacity={0.1} />
                  ) : null}
                  {/* A second ring marks the keyboard cursor distinctly from hover. */}
                  {cursorId === node.id ? (
                    <circle
                      r={r + 5}
                      fill="none"
                      stroke="var(--palace-accent)"
                      strokeWidth={2}
                    />
                  ) : null}
                  <circle
                    r={r}
                    fill={color}
                    stroke={
                      activeId === node.id
                        ? "var(--palace-text)"
                        : "var(--palace-base)"
                    }
                    strokeWidth={activeId === node.id ? 2 : 1.5}
                  />
                  {activeId === node.id || hubs.has(node.id) ? (
                    <text
                      x={r + 5}
                      y={4}
                      className={cn(
                        "text-2xs",
                        activeId === node.id
                          ? "fill-[var(--palace-text)]"
                          : "fill-[var(--palace-muted)]",
                      )}
                      style={{
                        paintOrder: "stroke",
                        stroke: "var(--palace-base)",
                        strokeWidth: 3,
                      }}
                    >
                      {titleById.get(node.id) ?? node.title}
                    </text>
                  ) : null}
                </g>
              );
            })}
          </g>
        </svg>

        {/* Visible controls: useful to mouse, touch and keyboard alike. */}
        <div className="absolute right-3 bottom-3 flex flex-col gap-1 rounded-md border border-border-hair bg-surface/90 p-1 backdrop-blur">
          <IconButton label="Zoom in" onClick={() => zoomBy(1.2)}>
            <Plus size={15} strokeWidth={1.75} aria-hidden />
          </IconButton>
          <IconButton label="Zoom out" onClick={() => zoomBy(1 / 1.2)}>
            <Minus size={15} strokeWidth={1.75} aria-hidden />
          </IconButton>
          <IconButton label="Fit everything on screen" onClick={fitToView}>
            <Maximize size={14} strokeWidth={1.75} aria-hidden />
          </IconButton>
        </div>

        <p
          id={helpId}
          className="pointer-events-none absolute bottom-3 left-3 max-w-[60%] text-2xs text-muted"
        >
          Ctrl and scroll to zoom · drag to pan · focus the graph and use arrow
          keys to walk between objects, Enter to open
        </p>

        {/* Reads the cursor node out as it moves. */}
        <span aria-live="polite" className="sr-only">
          {cursorAnnouncement}
        </span>
      </div>

      <aside className="w-full shrink-0 lg:w-56">
        <SectionLabel>Rooms</SectionLabel>
        <ul className="space-y-0.5">
          {rooms.map((room) => {
            const color = paletteColor(room.palette);
            const active = focusRooms.has(room.id);
            const count = objectCountByRoom.get(room.id) ?? 0;
            return (
              <li key={room.id}>
                <button
                  type="button"
                  onClick={() => toggleRoom(room.id)}
                  aria-pressed={active}
                  className={cn(
                    "flex min-h-11 w-full items-center gap-2 rounded-md px-2.5 text-left text-sm transition-quiet",
                    active
                      ? "bg-surface-2 text-text"
                      : "text-muted hover:bg-surface-2/60 hover:text-text",
                  )}
                >
                  <span
                    className="h-3 w-3 shrink-0 rounded-full"
                    style={{ backgroundColor: color }}
                    aria-hidden
                  />
                  <span className="min-w-0 flex-1 truncate">{room.name}</span>
                  <span className="tabular shrink-0 text-xs text-muted">
                    {count}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
        {focusRooms.size > 0 ? (
          <button
            type="button"
            onClick={() => setFocusRooms(new Set())}
            className="mt-2 h-9 px-2.5 text-xs text-muted transition-quiet hover:text-text"
          >
            Clear highlight
          </button>
        ) : null}
      </aside>
    </div>
  );
}
