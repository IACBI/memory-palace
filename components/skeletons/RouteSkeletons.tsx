import { Skeleton } from "@/components/ui/Skeleton";
import { GRID_COLS, GRID_ROWS } from "@/lib/layout";

/**
 * Shaped placeholders shown while the palace is read from storage.
 *
 * Each mirrors the geometry of the screen it stands in for, so the layout does
 * not jump when the real content arrives. Marked `aria-busy` and hidden from
 * assistive technology — there is nothing here to read out.
 */
function Region({ children }: { children: React.ReactNode }) {
  return (
    <div aria-busy="true" aria-hidden>
      {children}
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <Region>
      <Skeleton className="h-12 w-full rounded-xl" />
      <div className="mt-10 grid grid-cols-1 gap-10 lg:grid-cols-3">
        <div className="space-y-10 lg:col-span-2">
          <section>
            <Skeleton className="mb-4 h-6 w-40" />
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {Array.from({ length: 4 }, (_, i) => (
                <Skeleton key={i} className="h-28 rounded-xl" />
              ))}
            </div>
          </section>
          <section>
            <Skeleton className="mb-4 h-6 w-44" />
            <Skeleton className="h-64 rounded-xl" />
          </section>
        </div>
        <section>
          <Skeleton className="mb-4 h-6 w-28" />
          <Skeleton className="h-72 rounded-xl" />
        </section>
      </div>
    </Region>
  );
}

/** A floor plan of empty chambers — the strongest of the four visually. */
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
    <Region>
      <div className="mt-8 overflow-x-auto">
        <div
          className="palace-floor relative mx-auto grid aspect-[3/2] w-full min-w-[680px] gap-2 rounded-2xl border border-border-hair p-3"
          style={{
            gridTemplateColumns: `repeat(${GRID_COLS}, minmax(0, 1fr))`,
            gridTemplateRows: `repeat(${GRID_ROWS}, minmax(0, 1fr))`,
          }}
        >
          {chambers.map((c, i) => (
            <Skeleton
              key={i}
              className="rounded-xl"
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
      <div className="mt-6 flex flex-wrap gap-3">
        <Skeleton className="h-9 w-full max-w-xs rounded-lg" />
        <Skeleton className="h-9 w-32 rounded-lg" />
        <Skeleton className="h-9 w-32 rounded-lg" />
      </div>
      <div className="mt-4 overflow-hidden rounded-xl border border-border-hair">
        {Array.from({ length: 8 }, (_, i) => (
          <Skeleton
            key={i}
            className="h-14 rounded-none border-b border-base"
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
    <Region>
      <div className="mt-6 overflow-hidden rounded-2xl border border-border-hair bg-surface/40">
        <svg
          viewBox="0 0 960 520"
          className="h-[60vh] w-full animate-pulse"
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
            <Skeleton className="h-32 rounded-xl" />
          </div>
        ))}
      </div>
    </Region>
  );
}

export function RoomSkeleton() {
  return (
    <Region>
      <div className="border-b border-border-hair px-5 py-6 sm:px-8">
        <Skeleton className="h-4 w-20" />
        <div className="mt-4 flex items-start gap-4">
          <Skeleton className="h-12 w-12 rounded-xl" />
          <div className="flex-1">
            <Skeleton className="h-9 w-64" />
            <Skeleton className="mt-2 h-4 w-96 max-w-full" />
          </div>
        </div>
      </div>
      <div className="p-4 sm:p-6">
        <Skeleton className="h-[60vh] rounded-2xl" />
      </div>
    </Region>
  );
}
