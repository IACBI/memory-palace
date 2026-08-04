import type {
  ActivityEvent,
  Connection,
  KnowledgeObject,
  PalaceData,
  Room,
} from "@/lib/types";
import { DEFAULT_SETTINGS } from "@/lib/settings";

let counter = 0;
const nextId = (prefix: string) => `${prefix}-${(counter += 1)}`;

const T0 = "2026-01-01T00:00:00.000Z";

export function makeRoom(overrides: Partial<Room> = {}): Room {
  return {
    id: nextId("room"),
    name: "The Study",
    description: "Where thinking happens.",
    icon: "BookOpen",
    palette: "brass",
    position: { x: 0, y: 0, w: 2, h: 2 },
    createdAt: T0,
    updatedAt: T0,
    ...overrides,
  };
}

export function makeObject(
  overrides: Partial<KnowledgeObject> = {},
): KnowledgeObject {
  return {
    id: nextId("object"),
    roomId: "room-1",
    type: "note",
    title: "Fermentation log",
    content: "Day three: still bubbling.",
    tags: [],
    position: { x: 50, y: 50 },
    createdAt: T0,
    updatedAt: T0,
    ...overrides,
  };
}

export function makeConnection(
  overrides: Partial<Connection> = {},
): Connection {
  return {
    id: nextId("connection"),
    fromId: "object-1",
    toId: "object-2",
    ...overrides,
  };
}

export function makeActivity(
  overrides: Partial<ActivityEvent> = {},
): ActivityEvent {
  return {
    id: nextId("activity"),
    kind: "created",
    targetType: "object",
    targetId: "object-1",
    targetTitle: "Fermentation log",
    at: T0,
    ...overrides,
  };
}

export function makePalaceData(
  overrides: Partial<PalaceData> = {},
): PalaceData {
  return {
    version: 1,
    rooms: [],
    objects: [],
    connections: [],
    activity: [],
    settings: { ...DEFAULT_SETTINGS },
    ...overrides,
  };
}
