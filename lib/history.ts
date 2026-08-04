import type { PalaceData } from "@/lib/types";

/** How many steps back the user can go. */
export const HISTORY_LIMIT = 50;

/** Consecutive edits of the same thing inside this window collapse into one. */
export const COALESCE_WINDOW_MS = 800;

export interface HistoryEntry {
  /** What the palace looked like *before* the change. */
  snapshot: PalaceData;
  /** Shown in the undo toast, e.g. `deleted The Laboratory`. */
  label: string;
  /** Groups repeated edits of the same thing; `null` never coalesces. */
  coalesceKey: string | null;
  at: number;
}

export interface History {
  past: HistoryEntry[];
  future: HistoryEntry[];
}

export const EMPTY_HISTORY: History = { past: [], future: [] };

/**
 * Records a change, so it can be undone.
 *
 * Snapshots rather than inverse operations: the palace is one plain
 * serialisable document, and every mutation already replaces whole arrays, so
 * the untouched ones are shared by reference. Fifty snapshots of a normal
 * palace cost kilobytes, not megabytes — {@link lib/history.test.ts} asserts
 * that sharing rather than assuming it.
 *
 * Coalescing matters as much as the cap: typing a title fires a commit per
 * pause, and forty of those should be one undo step, not forty.
 */
export function pushHistory(
  history: History,
  entry: Omit<HistoryEntry, "at">,
  now = Date.now(),
): History {
  const previous = history.past[0];
  const shouldCoalesce =
    previous !== undefined &&
    entry.coalesceKey !== null &&
    previous.coalesceKey === entry.coalesceKey &&
    now - previous.at < COALESCE_WINDOW_MS;

  if (shouldCoalesce) {
    // Keep the *older* snapshot — undo should land before the whole burst —
    // but refresh the timestamp so a continuing burst keeps collapsing.
    const merged: HistoryEntry = { ...previous, label: entry.label, at: now };
    return { past: [merged, ...history.past.slice(1)], future: [] };
  }

  return {
    past: [{ ...entry, at: now }, ...history.past].slice(0, HISTORY_LIMIT),
    // Any new change abandons the redo branch, as every editor does.
    future: [],
  };
}

/** Moves one step back, returning the snapshot to apply. */
export function undo(
  history: History,
  current: PalaceData,
): { history: History; apply: PalaceData; label: string } | null {
  const [entry, ...rest] = history.past;
  if (!entry) return null;

  return {
    history: {
      past: rest,
      future: [{ ...entry, snapshot: current }, ...history.future].slice(
        0,
        HISTORY_LIMIT,
      ),
    },
    apply: entry.snapshot,
    label: entry.label,
  };
}

/** Moves one step forward again. */
export function redo(
  history: History,
  current: PalaceData,
): { history: History; apply: PalaceData; label: string } | null {
  const [entry, ...rest] = history.future;
  if (!entry) return null;

  return {
    history: {
      past: [{ ...entry, snapshot: current }, ...history.past].slice(
        0,
        HISTORY_LIMIT,
      ),
      future: rest,
    },
    apply: entry.snapshot,
    label: entry.label,
  };
}
