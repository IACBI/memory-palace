import { beforeEach, describe, expect, it } from "vitest";
import { usePalaceStore } from "@/lib/store";
import { STORAGE_KEY } from "@/lib/storage/local-storage";
import { DEFAULT_SETTINGS } from "@/lib/settings";
import { createSeedData } from "@/lib/seed-data";

const store = () => usePalaceStore.getState();

beforeEach(() => {
  window.localStorage.clear();
  usePalaceStore.setState({
    version: 1,
    rooms: [],
    objects: [],
    connections: [],
    activity: [],
    settings: { ...DEFAULT_SETTINGS },
    hydrationState: "loading",
    hydrationError: null,
    activeObjectId: null,
    commandPaletteOpen: false,
    newRoomRequested: false,
  });
});

describe("hydrate", () => {
  it("asks the user how to start when nothing is stored", async () => {
    await store().hydrate();
    expect(store().hydrationState).toBe("first-run");
    expect(store().rooms).toEqual([]);
  });

  it("loads a stored palace", async () => {
    const seed = createSeedData();
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));

    await store().hydrate();

    expect(store().hydrationState).toBe("ready");
    expect(store().rooms).toHaveLength(seed.rooms.length);
  });

  it("reports an error rather than hanging when the payload is unparseable", async () => {
    window.localStorage.setItem(STORAGE_KEY, "{not json");
    await store().hydrate();
    expect(store().hydrationState).toBe("error");
    expect(store().hydrationError).toMatch(/valid JSON/i);
  });

  it("reports an error when the stored document fails validation", async () => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 99 }));
    await store().hydrate();
    expect(store().hydrationState).toBe("error");
    expect(store().hydrationError).toMatch(/expected format/i);
  });

  it("never leaves the app in the loading state", async () => {
    for (const stored of [null, "{bad", JSON.stringify(createSeedData())]) {
      window.localStorage.clear();
      if (stored) window.localStorage.setItem(STORAGE_KEY, stored);
      usePalaceStore.setState({ hydrationState: "loading" });
      await store().hydrate();
      expect(store().hydrationState).not.toBe("loading");
    }
  });

  it("leaves the unreadable entry in place so nothing is lost", async () => {
    window.localStorage.setItem(STORAGE_KEY, "{not json");
    await store().hydrate();
    expect(window.localStorage.getItem(STORAGE_KEY)).toBe("{not json");
  });
});

describe("completeFirstRun", () => {
  it("starts an empty palace", async () => {
    await store().hydrate();
    store().completeFirstRun("empty");

    expect(store().hydrationState).toBe("ready");
    expect(store().rooms).toEqual([]);
    expect(store().settings).toEqual(DEFAULT_SETTINGS);
  });

  it("starts from the sample palace", async () => {
    await store().hydrate();
    store().completeFirstRun("sample");

    expect(store().hydrationState).toBe("ready");
    expect(store().rooms.length).toBeGreaterThan(0);
    expect(store().objects.length).toBeGreaterThan(0);
  });

  it("recovers from the error state too", async () => {
    window.localStorage.setItem(STORAGE_KEY, "{not json");
    await store().hydrate();
    expect(store().hydrationState).toBe("error");

    store().completeFirstRun("empty");
    expect(store().hydrationState).toBe("ready");
    expect(store().hydrationError).toBeNull();
  });
});
