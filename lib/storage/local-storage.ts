import type {
  ActivityEvent,
  Connection,
  KnowledgeObject,
  PalaceData,
  PalaceSettings,
  Room,
} from '@/lib/types';
import { normalizeSettings } from '@/lib/settings';
import type { StorageAdapter } from './adapter';

/** The localStorage key under which the palace document is stored. */
export const STORAGE_KEY = 'memory-palace-data:v1';

const OBJECT_TYPES = ['note', 'link', 'idea', 'file'] as const;
const PALETTES = ['brass', 'oxblood', 'forest', 'ink', 'plum', 'umber'] as const;
const ACTIVITY_KINDS = ['created', 'updated', 'moved', 'connected', 'deleted'] as const;
const TARGET_TYPES = ['room', 'object'] as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isString(value: unknown): value is string {
  return typeof value === 'string';
}

function isNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function isOneOf<T extends readonly string[]>(
  value: unknown,
  options: T,
): value is T[number] {
  return isString(value) && (options as readonly string[]).includes(value);
}

function validateRoom(value: unknown): Room | null {
  if (!isRecord(value)) return null;
  const pos = value.position;
  if (!isRecord(pos)) return null;
  if (!isNumber(pos.x) || !isNumber(pos.y) || !isNumber(pos.w) || !isNumber(pos.h)) {
    return null;
  }
  if (
    !isString(value.id) ||
    !isString(value.name) ||
    !isString(value.description) ||
    !isString(value.icon) ||
    !isOneOf(value.palette, PALETTES) ||
    !isString(value.createdAt) ||
    !isString(value.updatedAt)
  ) {
    return null;
  }
  return {
    id: value.id,
    name: value.name,
    description: value.description,
    icon: value.icon,
    palette: value.palette,
    position: { x: pos.x, y: pos.y, w: pos.w, h: pos.h },
    createdAt: value.createdAt,
    updatedAt: value.updatedAt,
  };
}

function validateObject(value: unknown): KnowledgeObject | null {
  if (!isRecord(value)) return null;
  const pos = value.position;
  if (!isRecord(pos) || !isNumber(pos.x) || !isNumber(pos.y)) return null;
  if (!Array.isArray(value.tags) || !value.tags.every(isString)) return null;
  if (
    !isString(value.id) ||
    !isString(value.roomId) ||
    !isOneOf(value.type, OBJECT_TYPES) ||
    !isString(value.title) ||
    !isString(value.content) ||
    !isString(value.createdAt) ||
    !isString(value.updatedAt)
  ) {
    return null;
  }
  if (value.url !== undefined && !isString(value.url)) return null;
  if (value.fileName !== undefined && !isString(value.fileName)) return null;
  if (value.pinned !== undefined && typeof value.pinned !== 'boolean') return null;

  const object: KnowledgeObject = {
    id: value.id,
    roomId: value.roomId,
    type: value.type,
    title: value.title,
    content: value.content,
    tags: [...(value.tags as string[])],
    position: { x: pos.x, y: pos.y },
    createdAt: value.createdAt,
    updatedAt: value.updatedAt,
  };
  if (isString(value.url)) object.url = value.url;
  if (isString(value.fileName)) object.fileName = value.fileName;
  if (typeof value.pinned === 'boolean') object.pinned = value.pinned;
  return object;
}

function validateConnection(value: unknown): Connection | null {
  if (!isRecord(value)) return null;
  if (!isString(value.id) || !isString(value.fromId) || !isString(value.toId)) {
    return null;
  }
  if (value.label !== undefined && !isString(value.label)) return null;
  const connection: Connection = {
    id: value.id,
    fromId: value.fromId,
    toId: value.toId,
  };
  if (isString(value.label)) connection.label = value.label;
  return connection;
}

function validateActivity(value: unknown): ActivityEvent | null {
  if (!isRecord(value)) return null;
  if (
    !isString(value.id) ||
    !isOneOf(value.kind, ACTIVITY_KINDS) ||
    !isOneOf(value.targetType, TARGET_TYPES) ||
    !isString(value.targetId) ||
    !isString(value.targetTitle) ||
    !isString(value.at)
  ) {
    return null;
  }
  return {
    id: value.id,
    kind: value.kind,
    targetType: value.targetType,
    targetId: value.targetId,
    targetTitle: value.targetTitle,
    at: value.at,
  };
}

/**
 * Preferences are non-critical, so we never fail an import over them: unknown
 * or missing fields (including older exports without `accent`/`textSize`) fall
 * back to their defaults rather than rejecting the whole document.
 */
function validateSettings(value: unknown): PalaceSettings {
  return normalizeSettings(isRecord(value) ? (value as Partial<PalaceSettings>) : null);
}

/**
 * Structurally validates an unknown value as {@link PalaceData}.
 *
 * Returns a fresh, well-typed copy when valid, or `null` when the shape is
 * wrong. Exported for reuse by the import feature.
 */
export function validatePalaceData(value: unknown): PalaceData | null {
  if (!isRecord(value)) return null;
  if (value.version !== 1) return null;
  if (
    !Array.isArray(value.rooms) ||
    !Array.isArray(value.objects) ||
    !Array.isArray(value.connections) ||
    !Array.isArray(value.activity)
  ) {
    return null;
  }

  const rooms: Room[] = [];
  for (const raw of value.rooms) {
    const room = validateRoom(raw);
    if (!room) return null;
    rooms.push(room);
  }

  const objects: KnowledgeObject[] = [];
  for (const raw of value.objects) {
    const object = validateObject(raw);
    if (!object) return null;
    objects.push(object);
  }

  const connections: Connection[] = [];
  for (const raw of value.connections) {
    const connection = validateConnection(raw);
    if (!connection) return null;
    connections.push(connection);
  }

  const activity: ActivityEvent[] = [];
  for (const raw of value.activity) {
    const event = validateActivity(raw);
    if (!event) return null;
    activity.push(event);
  }

  const settings = validateSettings(value.settings);

  return { version: 1, rooms, objects, connections, activity, settings };
}

/** Persists the palace document to the browser's localStorage. */
export class LocalStorageAdapter implements StorageAdapter {
  private readonly key: string;

  constructor(key: string = STORAGE_KEY) {
    this.key = key;
  }

  private get storage(): Storage | null {
    if (typeof window === 'undefined') return null;
    try {
      return window.localStorage;
    } catch {
      return null;
    }
  }

  async load(): Promise<PalaceData | null> {
    const storage = this.storage;
    if (!storage) return null;
    const raw = storage.getItem(this.key);
    if (!raw) return null;
    try {
      return validatePalaceData(JSON.parse(raw));
    } catch {
      return null;
    }
  }

  async save(data: PalaceData): Promise<void> {
    const storage = this.storage;
    if (!storage) return;
    try {
      storage.setItem(this.key, JSON.stringify(data));
    } catch {
      // Quota exceeded or serialisation failure — swallow so the UI stays
      // responsive; a future adapter can surface this to the user.
    }
  }

  async clear(): Promise<void> {
    const storage = this.storage;
    if (!storage) return;
    try {
      storage.removeItem(this.key);
    } catch {
      // Ignore — nothing else to do.
    }
  }
}
