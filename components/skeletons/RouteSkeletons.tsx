import { Skeleton } from "@/components/ui/Skeleton";
import { GRID_COLS, GRID_ROWS } from "@/lib/layout";

/**
 * Shaped placeholders shown while the palace is read from storage.
 *
 * Each mirrors the geometry of the screen it stands in for, so the layout does
 * not jump when the real content arrives. Marked `aria-busy` and hidden from
 * assistive technology — there is nothing here to read out.
 */
function Region({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div aria-busy="true" aria-hidden className={className}>
      {children}
    </div>
  );
}

/**
 * The three canvas routes fill their `CanvasStage`, so their placeholders have
 * to as well — a skeleton that reserves a different amount of space than the
 * thing it stands in for is the jump it exists to prevent.
 */
const STAGE = "absolute inset-0";

export function DashboardSkeleton() {
  return (
    <Region>
      <Skeleton className="mt-8 h-16 w-full rounded-lg sm:h-14" />
      <section className="mt-12">
        <Skeleton className="mb-4 h-3 w-36" />
        {/* The threshold bands, at their real height so the doorway list does
            not jump when the palace arrives. */}
        <div className="space-y-1">
          {Array.from({ length: 5 }, (_, i) => (
            <Skeleton key={i} className="h-17 rounded-md" />
          ))}
        </div>
      </section>
      <div className="mt-12 grid grid-cols-1 gap-10 lg:grid-cols-5 lg:gap-12">
        <section className="lg:col-span-3">
          <Skeleton className="mb-4 h-3 w-32" />
          <Skeleton className="h-84 rounded-lg" />
        </section>
        <section className="lg:col-span-2">
          <Skeleton className="mb-4 h-3 w-20" />
          <Skeleton className="h-84 rounded-lg" />
        </section>
      </div>
    </Region>
  );
}

/** A floor plan of empty chambers — the strongest of the six visually. */
export function PalaceSkeleton() {
  const chambers = [
    { x: 0, y: 0, w: 3, h: 3 },
    { x: 3, y: 0, w: 2, h: 2 },
    { x: 5, y: 0, w: 3, h: 4 },
    { x: 8, y: 0, w: 4, h: 3 },
    { x: 0, y: 3, w: 5, h: 3 },
    { x: 8, y: 3, w: 4, h: 5 },
  ];

  return (
    <Region className={STAGE}>
      <div className="h-full overflow-x-auto p-4 pt-20 sm:p-6 sm:pt-24">
        <div
          className="palace-floor relative grid h-full min-h-105 w-full min-w-[680px] gap-2 rounded-xl border border-border-hair p-3"
          style={{
            gridTemplateColumns: `repeat(${GRID_COLS}, minmax(0, 1fr))`,
            gridTemplateRows: `repeat(${GRID_ROWS}, minmax(0, 1fr))`,
          }}
        >
          {chambers.map((c, i) => (
            <Skeleton
              key={i}
              className="rounded-lg"
              style={{
                gridColumn: `${c.x + 1} / span ${c.w}`,
                gridRow: `${c.y + 1} / span ${c.h}`,
              }}
            />
          ))}
        </div>
      </div>
    </Region>
  );
}

export function LibrarySkeleton() {
  return (
    <Region>
      <div className="mt-2 flex flex-wrap gap-3">
        <Skeleton className="h-11 w-full max-w-xs rounded-md" />
        <Skeleton className="h-11 w-32 rounded-md" />
        <Skeleton className="h-11 w-32 rounded-md" />
      </div>
      <div className="mt-4 overflow-hidden rounded-lg border border-border-hair">
        {Array.from({ length: 8 }, (_, i) => (
          <Skeleton
            key={i}
            className="h-14 rounded-none border-b border-ground"
          />
        ))}
      </div>
    </Region>
  );
}

/** A still constellation, so the graph route does not open on blank space. */
export function GraphSkeleton() {
  const nodes = [
    [230, 180],
    [420, 120],
    [610, 220],
    [340, 330],
    [540, 400],
    [720, 330],
    [160, 380],
  ] as const;
  const links: Array<[number, number]> = [
    [0, 1],
    [1, 2],
    [0, 3],
    [3, 4],
    [4, 5],
    [3, 6],
    [2, 5],
  ];

  return (
    <Region className={STAGE}>
      <div className="h-full w-full overflow-hidden">
        <svg
          viewBox="0 0 960 520"
          className="h-full w-full animate-pulse"
          role="presentation"
        >
          {links.map(([a, b], i) => (
            <line
              key={i}
              x1={nodes[a][0]}
              y1={nodes[a][1]}
              x2={nodes[b][0]}
              y2={nodes[b][1]}
              stroke="var(--palace-border-strong)"
              strokeWidth={1}
            />
          ))}
          {nodes.map(([cx, cy], i) => (
            <circle
              key={i}
              cx={cx}
              cy={cy}
              r={i % 3 === 0 ? 13 : 8}
              fill="var(--palace-surface-2)"
              stroke="var(--palace-border-strong)"
            />
          ))}
        </svg>
      </div>
    </Region>
  );
}

export function SettingsSkeleton() {
  return (
    <Region>
      <div className="mt-8 space-y-8">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i}>
            <Skeleton className="mb-3 h-5 w-32" />
            <Skeleton className="h-32 rounded-lg" />
          </div>
        ))}
      </div>
    </Region>
  );
}

export function RoomSkeleton() {
  return (
    <Region className={STAGE}>
      <div className="absolute inset-x-0 top-0 px-4 py-4 sm:px-6 sm:py-6">
        <Skeleton className="h-4 w-20" />
        <div className="mt-4 flex items-start gap-4">
          <Skeleton className="h-11 w-11 rounded-lg" />
          <div className="flex-1">
            <Skeleton className="h-8 w-64 max-w-full" />
            <Skeleton className="mt-2 h-4 w-96 max-w-full" />
          </div>
        </div>
      </div>
      <div className="h-full p-3 pt-32 sm:p-6 sm:pt-30">
        <Skeleton className="h-full w-full rounded-none" />
      </div>
    </Region>
  );
}
