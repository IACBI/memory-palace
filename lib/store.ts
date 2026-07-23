import { create } from 'zustand';
import type {
  ActivityEvent,
  ActivityKind,
  Connection,
  KnowledgeObject,
  ObjectPosition,
  PalaceData,
  PalaceSettings,
  Room,
  TargetType,
} from '@/lib/types';
import type { StorageAdapter } from '@/lib/storage/adapter';
import { LocalStorageAdapter } from '@/lib/storage/local-storage';
import { createSeedData } from '@/lib/seed-data';
import { DEFAULT_SETTINGS, normalizeSettings } from '@/lib/settings';

const ACTIVITY_CAP = 50;
const SAVE_DEBOUNCE_MS = 300;
const MOVE_LOG_THROTTLE_MS = 5000;

/** The pluggable persistence layer. Swap here to change backends. */
const adapter: StorageAdapter = new LocalStorageAdapter();

function nowISO(): string {
  return new Date().toISOString();
}

function uuid(): string {
  return crypto.randomUUID();
}

/** Tracks when we last logged a 'moved' event per object, to throttle spam. */
const lastMoveLoggedAt = new Map<string, number>();

/** Tracks when we last logged an 'updated' event per object, to throttle spam. */
const lastUpdateLoggedAt = new Map<string, number>();
const UPDATE_LOG_THROTTLE_MS = 5000;

let saveTimer: ReturnType<typeof setTimeout> | null = null;

/** The serialisable slice of the store. */
interface PalaceState extends PalaceData {
  hydrated: boolean;
  activeObjectId: string | null;
  commandPaletteOpen: boolean;
  newRoomRequested: boolean;
}

interface PalaceActions {
  hydrate: () => Promise<void>;

  // Rooms
  createRoom: (input: Partial<Omit<Room, 'id' | 'createdAt' | 'updatedAt'>>) => Room;
  updateRoom: (id: string, patch: Partial<Omit<Room, 'id' | 'createdAt'>>) => void;
  deleteRoom: (id: string) => void;

  // Objects
  createObject: (
    input: Partial<Omit<KnowledgeObject, 'id' | 'createdAt' | 'updatedAt'>> & {
      roomId: string;
    },
  ) => KnowledgeObject;
  updateObject: (
    id: string,
    patch: Partial<Omit<KnowledgeObject, 'id' | 'createdAt'>>,
  ) => void;
  moveObject: (id: string, position: ObjectPosition) => void;
  deleteObject: (id: string) => void;
  /** Re-inserts a previously deleted object and its connections (for undo). */
  restoreObject: (object: KnowledgeObject, connections: Connection[]) => void;
  togglePin: (id: string) => void;

  // Connections
  addConnection: (fromId: string, toId: string, label?: string) => Connection | null;
  removeConnection: (id: string) => void;

  // Data lifecycle
  importData: (data: PalaceData) => void;
  exportData: () => PalaceData;
  resetToSample: () => void;
  clearAll: () => void;
  updateSettings: (patch: Partial<PalaceSettings>) => void;

  // UI
  openObject: (id: string) => void;
  closeObject: () => void;
  setCommandPaletteOpen: (open: boolean) => void;
  requestNewRoom: () => void;
  clearNewRoomRequest: () => void;
}

export type PalaceStore = PalaceState & PalaceActions;

/** Extracts the persistable {@link PalaceData} from full store state. */
function toPalaceData(state: PalaceState): PalaceData {
  return {
    version: 1,
    rooms: state.rooms,
    objects: state.objects,
    connections: state.connections,
    activity: state.activity,
    settings: state.settings,
  };
}

function makeActivity(
  kind: ActivityKind,
  targetType: TargetType,
  targetId: string,
  targetTitle: string,
): ActivityEvent {
  return { id: uuid(), kind, targetType, targetId, targetTitle, at: nowISO() };
}

/** Prepends an event and caps the log at {@link ACTIVITY_CAP}. */
function withActivity(
  activity: ActivityEvent[],
  event: ActivityEvent,
): ActivityEvent[] {
  return [event, ...activity].slice(0, ACTIVITY_CAP);
}

export const usePalaceStore = create<PalaceStore>((set, get) => {
  /** Debounced persistence of the current palace document. */
  const persist = (): void => {
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      saveTimer = null;
      void adapter.save(toPalaceData(get()));
    }, SAVE_DEBOUNCE_MS);
  };

  return {
    // --- Initial state ---
    version: 1,
    rooms: [],
    objects: [],
    connections: [],
    activity: [],
    settings: { ...DEFAULT_SETTINGS },
    hydrated: false,
    activeObjectId: null,
    commandPaletteOpen: false,
    newRoomRequested: false,

    // --- Lifecycle ---
    hydrate: async () => {
      const loaded = (await adapter.load()) ?? createSeedData();
      set({
        version: 1,
        rooms: loaded.rooms,
        objects: loaded.objects,
        connections: loaded.connections,
        activity: loaded.activity,
        settings: normalizeSettings(loaded.settings),
        hydrated: true,
      });
    },

    // --- Rooms ---
    createRoom: (input) => {
      const timestamp = nowISO();
      const room: Room = {
        id: uuid(),
        name: input.name ?? 'Untitled Room',
        description: input.description ?? '',
        icon: input.icon ?? 'DoorOpen',
        palette: input.palette ?? 'brass',
        position: input.position ?? { x: 0, y: 0, w: 3, h: 3 },
        createdAt: timestamp,
        updatedAt: timestamp,
      };
      set((state) => ({
        rooms: [...state.rooms, room],
        activity: withActivity(
          state.activity,
          makeActivity('created', 'room', room.id, room.name),
        ),
      }));
      persist();
      return room;
    },

    updateRoom: (id, patch) => {
      set((state) => {
        const existing = state.rooms.find((room) => room.id === id);
        if (!existing) return state;
        const updated: Room = { ...existing, ...patch, id, updatedAt: nowISO() };
        return {
          rooms: state.rooms.map((room) => (room.id === id ? updated : room)),
          activity: withActivity(
            state.activity,
            makeActivity('updated', 'room', id, updated.name),
          ),
        };
      });
      persist();
    },

    deleteRoom: (id) => {
      set((state) => {
        const room = state.rooms.find((candidate) => candidate.id === id);
        if (!room) return state;
        const doomedObjectIds = new Set(
          state.objects.filter((object) => object.roomId === id).map((o) => o.id),
        );
        return {
          rooms: state.rooms.filter((candidate) => candidate.id !== id),
          objects: state.objects.filter((object) => object.roomId !== id),
          connections: state.connections.filter(
            (connection) =>
              !doomedObjectIds.has(connection.fromId) &&
              !doomedObjectIds.has(connection.toId),
          ),
          activity: withActivity(
            state.activity,
            makeActivity('deleted', 'room', id, room.name),
          ),
        };
      });
      persist();
    },

    // --- Objects ---
    createObject: (input) => {
      const timestamp = nowISO();
      const object: KnowledgeObject = {
        id: uuid(),
        roomId: input.roomId,
        type: input.type ?? 'note',
        title: input.title ?? 'Untitled',
        content: input.content ?? '',
        url: input.url,
        fileName: input.fileName,
        tags: input.tags ?? [],
        position: input.position ?? { x: 50, y: 50 },
        pinned: input.pinned,
        createdAt: timestamp,
        updatedAt: timestamp,
      };
      set((state) => ({
        objects: [...state.objects, object],
        activity: withActivity(
          state.activity,
          makeActivity('created', 'object', object.id, object.title),
        ),
      }));
      persist();
      return object;
    },

    updateObject: (id, patch) => {
      const now = Date.now();
      const shouldLog = now - (lastUpdateLoggedAt.get(id) ?? 0) >= UPDATE_LOG_THROTTLE_MS;
      set((state) => {
        const existing = state.objects.find((object) => object.id === id);
        if (!existing) return state;
        const updated: KnowledgeObject = {
          ...existing,
          ...patch,
          id,
          updatedAt: nowISO(),
        };
        return {
          objects: state.objects.map((object) => (object.id === id ? updated : object)),
          activity: shouldLog
            ? withActivity(
                state.activity,
                makeActivity('updated', 'object', id, updated.title),
              )
            : state.activity,
        };
      });
      if (shouldLog) lastUpdateLoggedAt.set(id, now);
      persist();
    },

    moveObject: (id, position) => {
      const object = get().objects.find((candidate) => candidate.id === id);
      if (!object) return;

      const now = Date.now();
      const last = lastMoveLoggedAt.get(id) ?? 0;
      const shouldLog = now - last >= MOVE_LOG_THROTTLE_MS;
      if (shouldLog) lastMoveLoggedAt.set(id, now);

      set((state) => ({
        objects: state.objects.map((candidate) =>
          candidate.id === id
            ? { ...candidate, position: { ...position }, updatedAt: nowISO() }
            : candidate,
        ),
        activity: shouldLog
          ? withActivity(
              state.activity,
              makeActivity('moved', 'object', id, object.title),
            )
          : state.activity,
      }));
      persist();
    },

    deleteObject: (id) => {
      set((state) => {
        const object = state.objects.find((candidate) => candidate.id === id);
        if (!object) return state;
        return {
          objects: state.objects.filter((candidate) => candidate.id !== id),
          connections: state.connections.filter(
            (connection) => connection.fromId !== id && connection.toId !== id,
          ),
          activeObjectId: state.activeObjectId === id ? null : state.activeObjectId,
          activity: withActivity(
            state.activity,
            makeActivity('deleted', 'object', id, object.title),
          ),
        };
      });
      persist();
    },

    restoreObject: (object, connections) => {
      set((state) => {
        if (state.objects.some((candidate) => candidate.id === object.id)) {
          return state;
        }
        const existingConnectionIds = new Set(
          state.connections.map((connection) => connection.id),
        );
        const restoredConnections = connections.filter(
          (connection) => !existingConnectionIds.has(connection.id),
        );
        return {
          objects: [...state.objects, object],
          connections: [...state.connections, ...restoredConnections],
          activity: withActivity(
            state.activity,
            makeActivity('created', 'object', object.id, object.title),
          ),
        };
      });
      persist();
    },

    togglePin: (id) => {
      set((state) => {
        const existing = state.objects.find((object) => object.id === id);
        if (!existing) return state;
        const updated: KnowledgeObject = {
          ...existing,
          pinned: !existing.pinned,
          updatedAt: nowISO(),
        };
        return {
          objects: state.objects.map((object) => (object.id === id ? updated : object)),
          activity: withActivity(
            state.activity,
            makeActivity('updated', 'object', id, updated.title),
          ),
        };
      });
      persist();
    },

    // --- Connections ---
    addConnection: (fromId, toId, label) => {
      if (fromId === toId) return null;
      const state = get();
      const exists = state.connections.some(
        (connection) =>
          (connection.fromId === fromId && connection.toId === toId) ||
          (connection.fromId === toId && connection.toId === fromId),
      );
      if (exists) return null;

      const connection: Connection = { id: uuid(), fromId, toId };
      if (label) connection.label = label;
      const source = state.objects.find((object) => object.id === fromId);

      set((current) => ({
        connections: [...current.connections, connection],
        activity: withActivity(
          current.activity,
          makeActivity('connected', 'object', fromId, source?.title ?? 'Connection'),
        ),
      }));
      persist();
      return connection;
    },

    removeConnection: (id) => {
      set((state) => {
        const connection = state.connections.find((candidate) => candidate.id === id);
        if (!connection) return state;
        const source = state.objects.find((object) => object.id === connection.fromId);
        return {
          connections: state.connections.filter((candidate) => candidate.id !== id),
          activity: withActivity(
            state.activity,
            makeActivity(
              'connected',
              'object',
              connection.fromId,
              source?.title ?? 'Connection',
            ),
          ),
        };
      });
      persist();
    },

    // --- Data lifecycle ---
    importData: (data) => {
      set({
        version: 1,
        rooms: data.rooms,
        objects: data.objects,
        connections: data.connections,
        activity: data.activity,
        settings: data.settings,
        activeObjectId: null,
      });
      persist();
    },

    exportData: () => toPalaceData(get()),

    resetToSample: () => {
      const seed = createSeedData();
      set({
        version: 1,
        rooms: seed.rooms,
        objects: seed.objects,
        connections: seed.connections,
        activity: seed.activity,
        settings: seed.settings,
        activeObjectId: null,
      });
      persist();
    },

    clearAll: () => {
      lastMoveLoggedAt.clear();
      lastUpdateLoggedAt.clear();
      set({
        version: 1,
        rooms: [],
        objects: [],
        connections: [],
        activity: [],
        settings: { ...DEFAULT_SETTINGS },
        activeObjectId: null,
      });
      void adapter.clear();
    },

    updateSettings: (patch) => {
      set((state) => ({ settings: { ...state.settings, ...patch } }));
      persist();
    },

    // --- UI ---
    openObject: (id) => set({ activeObjectId: id }),
    closeObject: () => set({ activeObjectId: null }),
    setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),
    requestNewRoom: () => set({ newRoomRequested: true }),
    clearNewRoomRequest: () => set({ newRoomRequested: false }),
  };
});
