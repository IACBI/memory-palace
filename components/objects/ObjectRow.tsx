import { ObjectGlyph } from "@/components/objects/ObjectGlyph";
import { Highlight } from "@/components/ui/Highlight";
import type { MatchRange } from "@/lib/search";
import type { ObjectType, PaletteKey } from "@/lib/types";

/** The minimum an object has to expose to be listed. */
export interface ListedObject {
  title: string;
  type: ObjectType;
}

/**
 * One object as a two-line row: coloured glyph, title, where it lives.
 *
 * Presentational on purpose — it renders spans, not a button. The dashboard
 * wraps it in a button of its own; the command palette's rows are already
 * `role="option"` buttons, and nesting a control inside one is exactly the
 * `nested-interactive` defect this codebase has hit before.
 *
 * The library's list is deliberately *not* built from this. Its row is a
 * table-like layout — title with an inline pin, then tag, room and time
 * columns — which is a different design, not this one with extras. What the
 * two genuinely share is `ObjectGlyph`, and that is what they share.
 */
export function ObjectRow({
  object,
  palette,
  roomName,
  matches = [],
  trailing,
  size = "sm",
}: {
  object: ListedObject;
  palette: PaletteKey | null | undefined;
  /** `null` or missing renders as "Unassigned". */
  roomName: string | null | undefined;
  /** Search hits to mark in the title. */
  matches?: readonly MatchRange[];
  /** Timestamp, pin, whatever the screen wants on the right. */
  trailing?: React.ReactNode;
  size?: "sm" | "md";
}) {
  return (
    <span className="flex w-full items-center gap-3 text-left">
      <ObjectGlyph type={object.type} palette={palette} size={size} />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm text-text">
          <Highlight text={object.title} ranges={matches} />
        </span>
        <span className="block truncate text-xs text-muted">
          {roomName ?? "Unassigned"}
        </span>
      </span>
      {trailing}
    </span>
  );
}
