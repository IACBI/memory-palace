/**
 * Core data model for Memory Palace.
 *
 * All timestamps are ISO 8601 strings. All ids are generated with
 * `crypto.randomUUID()`.
 */

/** The six room accent palettes. */
export type PaletteKey = 'brass' | 'oxblood' | 'forest' | 'ink' | 'plum' | 'umber';

/** The app-wide accent themes a user can choose in Settings. */
export type AccentKey = 'brass' | 'copper' | 'sage' | 'slate';

/** Reading-size preference, applied as a root font-size scale. */
export type TextSize = 'small' | 'medium' | 'large';

/** Type of a knowledge object stored inside a room. */
export type ObjectType = 'note' | 'link' | 'idea' | 'file';

/** Kinds of activity we record for the timeline. */
export type ActivityKind = 'created' | 'updated' | 'moved' | 'connected' | 'deleted';

/** A target of an activity event. */
export type TargetType = 'room' | 'object';

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
  /** App-wide accent theme. */
  accent: AccentKey;
  /** Reading size, applied as a root font-size scale. */
  textSize: TextSize;
  reduceMotion: boolean;
  lastView: string;
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
