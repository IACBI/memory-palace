import {
  Archive,
  BookOpen,
  Compass,
  DoorOpen,
  Feather,
  FlaskConical,
  Frame,
  Landmark,
  Map,
  Music,
  Palette,
  Sprout,
  Telescope,
  type LucideIcon,
} from "lucide-react";
import { PALETTE_KEYS, type PaletteKey } from "@/lib/types";

/**
 * The icons a room can use, as a static map of named imports.
 *
 * Deliberately not `import { icons } from "lucide-react"`: that is a namespace
 * import of ~2,000 components which no bundler can tree-shake, and it used to
 * put a 155 KB gzipped chunk on every route of this app. Named imports mean
 * only these thirteen ship.
 */
export const ROOM_ICONS = {
  BookOpen,
  FlaskConical,
  Frame,
  Sprout,
  Map,
  Archive,
  Compass,
  Feather,
  Landmark,
  Telescope,
  Music,
  Palette,
  DoorOpen,
} as const satisfies Record<string, LucideIcon>;

/** A room icon name. Unknown strings are a type error, not a runtime fallback. */
export type RoomIconName = keyof typeof ROOM_ICONS;

/** The icon used when a stored name is not recognised. */
export const FALLBACK_ROOM_ICON: RoomIconName = "DoorOpen";

/** Curated icons offered when creating or editing a room, in display order. */
export const ROOM_ICON_CHOICES: readonly RoomIconName[] = [
  "BookOpen",
  "FlaskConical",
  "Frame",
  "Sprout",
  "Map",
  "Archive",
  "Compass",
  "Feather",
  "Landmark",
  "Telescope",
  "Music",
  "Palette",
];

/**
 * Narrows an arbitrary stored string to a known icon name.
 *
 * Uses `Object.hasOwn` rather than `in`: `"constructor" in ROOM_ICONS` is true
 * through the prototype chain, and would hand React `Object` to render.
 */
export function isRoomIconName(value: unknown): value is RoomIconName {
  return typeof value === "string" && Object.hasOwn(ROOM_ICONS, value);
}

/** The six palette keys, in display order. */
export const PALETTE_CHOICES: readonly PaletteKey[] = PALETTE_KEYS;
