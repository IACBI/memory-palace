import { OBJECT_TYPE_META } from "@/lib/object-meta";
import { paletteColor, paletteTint } from "@/lib/palette";
import type { ObjectType, PaletteKey } from "@/lib/types";
import { cn } from "@/lib/cn";

const SIZES = {
  sm: { box: "h-7 w-7", icon: 14 },
  md: { box: "h-9 w-9", icon: 16 },
} as const;

/**
 * An object's type icon, tinted with its room's colour.
 *
 * The same eleven lines appeared in four screens, each with its own idea of
 * how big the chip was and which tint it used.
 */
export function ObjectGlyph({
  type,
  palette,
  size = "sm",
}: {
  type: ObjectType;
  /** The owning room's palette; `null` for an object with no room. */
  palette: PaletteKey | null | undefined;
  size?: keyof typeof SIZES;
}) {
  const Icon = OBJECT_TYPE_META[type].icon;
  const { box, icon } = SIZES[size];

  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center rounded-md",
        box,
      )}
      style={{
        backgroundColor: paletteTint(palette, "chip"),
        color: paletteColor(palette),
      }}
    >
      <Icon size={icon} strokeWidth={1.75} aria-hidden />
    </span>
  );
}
