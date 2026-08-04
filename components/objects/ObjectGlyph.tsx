import { OBJECT_TYPE_META } from "@/lib/object-meta";
import { paletteColor, paletteTint } from "@/lib/palette";
import type { ObjectType, PaletteKey } from "@/lib/types";

const SIZES = {
  sm: { box: "h-7 w-7 rounded-md", icon: 14 },
  md: { box: "h-8 w-8 rounded-md", icon: 15 },
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
      className={`flex shrink-0 items-center justify-center ${box}`}
      style={{
        backgroundColor: paletteTint(palette, "chip"),
        color: paletteColor(palette),
      }}
    >
      <Icon size={icon} strokeWidth={1.75} aria-hidden />
    </span>
  );
}
