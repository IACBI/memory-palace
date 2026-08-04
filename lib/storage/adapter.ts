import type { PalaceData } from "@/lib/types";

/**
 * Persistence contract for the palace document.
 *
 * The store depends only on this interface, so the current
 * {@link LocalStorageAdapter} can later be swapped for a database-backed
 * adapter (e.g. Postgres, IndexedDB, a REST API) without touching store code.
 */
export interface StorageAdapter {
  /** Returns the persisted palace, or `null` when nothing is stored. */
  load(): Promise<PalaceData | null>;
  /** Persists the full palace document. */
  save(data: PalaceData): Promise<void>;
  /** Removes any persisted palace data. */
  clear(): Promise<void>;
}
