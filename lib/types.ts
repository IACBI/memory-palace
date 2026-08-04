/**
 * Core data model for Memory Palace.
 *
 * All timestamps are ISO 8601 strings; all ids come from `newId()`.
 *
 * Each closed set is declared once as a `const` array and its type derived
 * from it, so the runtime validators in `lib/storage` and the compile-time
 * types can never drift apart.
 */

/** The six room accent palettes. */
export const PALETTE_KEYS = [
  "brass",
  "oxblood",
  "forest",
  "ink",
  "plum",
  "umber",
] as const;
export type PaletteKey = (typeof PALETTE_KEYS)[number];

/** The app-wide accent themes a user can choose in Settings. */
export const ACCENT_KEYS = ["brass", "copper", "sage", "slate"] as const;
export type AccentKey = (typeof ACCENT_KEYS)[number];

/**
 * Surface theme.
 *
 * `palace` is the candlelit dark original; `parchment` is a light theme with
 * its own identity rather than an inversion of it. `auto` follows the system.
 */
export const THEME_KEYS = ["auto", "palace", "parchment"] as const;
export type ThemeKey = (typeof THEME_KEYS)[number];

/** Reading-size preference, applied as a root font-size scale. */
export const TEXT_SIZE_KEYS = ["small", "medium", "large"] as const;
export type TextSize = (typeof TEXT_SIZE_KEYS)[number];

/** Type of a knowledge object stored inside a room. */
export const OBJECT_TYPE_KEYS = ["note", "link", "idea", "file"] as const;
export type ObjectType = (typeof OBJECT_TYPE_KEYS)[number];

/** Kinds of activity we record for the timeline. */
export const ACTIVITY_KINDS = [
  "created",
  "updated",
  "moved",
  "connected",
  "disconnected",
  "deleted",
] as const;
export type ActivityKind = (typeof ACTIVITY_KINDS)[number];

/** What an activity event points at. */
export const TARGET_TYPES = ["room", "object"] as const;
export type TargetType = (typeof TARGET_TYPES)[number];

/**
 * A room's placement on the palace floor plan. Expressed in palace grid
 * units (the palace grid is ~12 columns x 8 rows).
 */
export interface RoomPosition {
  x: number;
  y: number;
  w: number;
  h: number;
}

/**
 * A knowledge object's placement inside a room. Expressed as a percentage
 * (0-100) of the room's width/height so it survives room resizing.
 */
export interface ObjectPosition {
  x: number;
  y: number;
}

/** A room in the palace — a spatial container for knowledge objects. */
export interface Room {
  id: string;
  name: string;
  description: string;
  /** A lucide icon name, e.g. "BookOpen". */
  icon: string;
  palette: PaletteKey;
  position: RoomPosition;
  createdAt: string;
  updatedAt: string;
}

/** A single unit of knowledge that lives inside a room. */
export interface KnowledgeObject {
  id: string;
  roomId: string;
  type: ObjectType;
  title: string;
  content: string;
  url?: string;
  fileName?: string;
  tags: string[];
  position: ObjectPosition;
  pinned?: boolean;
  createdAt: string;
  updatedAt: string;
}

/** A directed relationship between two knowledge objects. */
export interface Connection {
  id: string;
  fromId: string;
  toId: string;
  label?: string;
}

/** A recorded change, used to drive the activity timeline. */
export interface ActivityEvent {
  id: string;
  kind: ActivityKind;
  targetType: TargetType;
  targetId: string;
  targetTitle: string;
  at: string;
}

/** User-facing preferences that persist with the palace. */
export interface PalaceSettings {
  /** Surface theme: system, dark or light. */
  theme: ThemeKey;
  /** App-wide accent theme. */
  accent: AccentKey;
  /** Reading size, applied as a root font-size scale. */
  textSize: TextSize;
  reduceMotion: boolean;
}

/** The complete, serialisable palace document. */
export interface PalaceData {
  version: 1;
  rooms: Room[];
  objects: KnowledgeObject[];
  connections: Connection[];
  activity: ActivityEvent[];
  settings: PalaceSettings;
}
