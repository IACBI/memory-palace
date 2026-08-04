import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createPersistence, useSaveStatus } from "@/lib/persistence";
import { LocalStorageAdapter, STORAGE_KEY } from "@/lib/storage/local-storage";
import { CorruptPalaceError, StorageQuotaError } from "@/lib/storage/errors";
import type { StorageAdapter } from "@/lib/storage/adapter";
import { makePalaceData, makeRoom } from "../factories";

const data = () => makePalaceData({ rooms: [makeRoom()] });

/** An adapter that records writes and can be told to fail. */
function fakeAdapter() {
  const saves: number[] = [];
  let failWith: Error | null = null;
  const adapter: StorageAdapter = {
    load: async () => null,
    save: async () => {
      if (failWith) throw failWith;
      saves.push(Date.now());
    },
    clear: async () => {},
  };
  return {
    adapter,
    saves,
    failNext: (error: Error) => {
      failWith = error;
    },
    recover: () => {
      failWith = null;
    },
  };
}

/** Every instance created in a test, torn down afterwards. */
const created: Array<{ dispose: () => void }> = [];

function makePersistence(...args: Parameters<typeof createPersistence>) {
  const instance = createPersistence(...args);
  created.push(instance);
  return instance;
}

beforeEach(() => {
  vi.useFakeTimers();
  useSaveStatus.setState({ status: "idle", lastSavedAt: null });
});

afterEach(() => {
  // Page-lifecycle listeners are global; leaking them lets one test's
  // `pagehide` drive another test's adapter.
  created.splice(0).forEach((instance) => instance.dispose());
  vi.useRealTimers();
});

describe("createPersistence", () => {
  it("debounces bursts of writes into a single save", async () => {
    const fake = fakeAdapter();
    const { schedule } = makePersistence(fake.adapter, data);

    schedule();
    schedule();
    schedule();
    expect(fake.saves).toHaveLength(0);

    await vi.advanceTimersByTimeAsync(300);
    expect(fake.saves).toHaveLength(1);
  });

  it("reports pending while a write is queued and saved once it lands", async () => {
    const fake = fakeAdapter();
    const { schedule } = makePersistence(fake.adapter, data);

    schedule();
    expect(useSaveStatus.getState().status).toBe("pending");

    await vi.advanceTimersByTimeAsync(300);
    expect(useSaveStatus.getState().status).toBe("saved");
    expect(useSaveStatus.getState().lastSavedAt).not.toBeNull();
  });

  it("flush writes immediately and cancels the pending timer", async () => {
    const fake = fakeAdapter();
    const { schedule, flush } = makePersistence(fake.adapter, data);

    schedule();
    await flush();
    expect(fake.saves).toHaveLength(1);

    // The cancelled timer must not fire a second write.
    await vi.advanceTimersByTimeAsync(1000);
    expect(fake.saves).toHaveLength(1);
  });

  it("flushes pending work when the page is hidden", async () => {
    const fake = fakeAdapter();
    const { schedule } = makePersistence(fake.adapter, data);

    schedule();
    expect(fake.saves).toHaveLength(0);

    window.dispatchEvent(new Event("pagehide"));
    await vi.advanceTimersByTimeAsync(0);
    expect(fake.saves).toHaveLength(1);
  });

  it("surfaces a quota failure as an error status instead of swallowing it", async () => {
    const fake = fakeAdapter();
    const { schedule } = makePersistence(fake.adapter, data);
    fake.failNext(new StorageQuotaError());

    schedule();
    await vi.advanceTimersByTimeAsync(300);

    expect(useSaveStatus.getState().status).toBe("error");
  });

  it("recovers to saved once writes succeed again", async () => {
    const fake = fakeAdapter();
    const { schedule } = makePersistence(fake.adapter, data);

    fake.failNext(new StorageQuotaError());
    schedule();
    await vi.advanceTimersByTimeAsync(300);
    expect(useSaveStatus.getState().status).toBe("error");

    fake.recover();
    schedule();
    await vi.advanceTimersByTimeAsync(300);
    expect(useSaveStatus.getState().status).toBe("saved");
  });

  it("never rejects, so a failed write cannot become an unhandled rejection", async () => {
    const fake = fakeAdapter();
    const { flush } = makePersistence(fake.adapter, data);
    fake.failNext(new Error("disk on fire"));
    await expect(flush()).resolves.toBeUndefined();
  });
});

describe("LocalStorageAdapter quota handling", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    window.localStorage.clear();
  });

  it("throws StorageQuotaError rather than failing silently", async () => {
    const adapter = new LocalStorageAdapter();
    const quota = new DOMException("full", "QuotaExceededError");
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw quota;
    });

    await expect(adapter.save(data())).rejects.toBeInstanceOf(
      StorageQuotaError,
    );
  });

  it("round-trips a document through localStorage", async () => {
    const adapter = new LocalStorageAdapter();
    const document = data();
    await adapter.save(document);

    expect(window.localStorage.getItem(STORAGE_KEY)).toBeTruthy();
    const loaded = await adapter.load();
    expect(loaded!.rooms).toHaveLength(1);
  });

  it("returns null only when nothing is stored", async () => {
    expect(await new LocalStorageAdapter().load()).toBeNull();
  });

  it("throws for a corrupt payload, so it is not mistaken for an empty palace", async () => {
    window.localStorage.setItem(STORAGE_KEY, "{not json");
    await expect(new LocalStorageAdapter().load()).rejects.toBeInstanceOf(
      CorruptPalaceError,
    );
  });

  it("throws when the stored document fails validation", async () => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 99 }));
    await expect(new LocalStorageAdapter().load()).rejects.toBeInstanceOf(
      CorruptPalaceError,
    );
  });
});
