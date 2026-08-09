import Link from "next/link";
import { RoomIcon } from "@/components/RoomIcon";
import { paletteColor, paletteTint, thresholdVars } from "@/lib/palette";
import type { Room } from "@/lib/types";

/**
 * A room presented as a doorway — this identity's signature element.
 *
 * At rest the row is a name, a leader rule and a count, with a short tick of
 * the room's colour at its leading edge. On approach the tick grows into a
 * full jamb and the room's light spills across the band. Both effects belong
 * to the `.threshold` utility in `globals.css`; everything here does is hand
 * it the three colours to use.
 *
 * The leader rule is not decoration: these rows are as wide as the screen, and
 * it is what carries the eye from a room's name to its count. It is the same
 * device a table of contents uses, for the same reason.
 *
 * Deliberately not the palace floor plan's `RoomChamber`. That one is
 * positioned on a grid and shows where a room *is*; this one is a list and
 * shows what is *in* it.
 */
export function RoomThreshold({
  room,
  count,
  index = 0,
}: {
  room: Room;
  count: number;
  /** Position in the list, for the staggered arrival. Cap it at the call site. */
  index?: number;
}) {
  return (
    <li
      className="arrive-item"
      style={{ ["--i" as string]: index } as React.CSSProperties}
    >
      <Link
        href={`/room?r=${room.id}`}
        className="threshold group flex items-center gap-4 rounded-md py-3.5 pr-4 pl-5 transition-quiet hover:bg-surface/60"
        style={thresholdVars(room.palette) as React.CSSProperties}
      >
        <span
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md"
          style={{
            backgroundColor: paletteTint(room.palette, "chip"),
            color: paletteColor(room.palette),
          }}
        >
          <RoomIcon name={room.icon} size={18} strokeWidth={1.75} aria-hidden />
        </span>

        <span className="min-w-0 max-w-full">
          <span className="block truncate font-display text-lg leading-tight font-semibold tracking-tight text-text">
            {room.name}
          </span>
          {room.description ? (
            <span className="mt-0.5 block truncate text-xs text-muted">
              {room.description}
            </span>
          ) : null}
        </span>

        <span
          className="hidden h-px flex-1 bg-border-hair sm:block"
          aria-hidden
        />

        <span className="tabular ml-auto shrink-0 font-display text-lg font-semibold text-muted transition-quiet group-hover:text-text sm:ml-0">
          {count}
          <span className="sr-only"> {count === 1 ? "object" : "objects"}</span>
        </span>
      </Link>
    </li>
  );
}
