import { expect, test, type Page } from "@playwright/test";
import { objectCards, openFirstRoom, openPalace } from "./helpers";

/**
 * The app is entirely local-first, so being unusable offline was the one place
 * the product contradicted its own premise.
 *
 * The service worker only registers in a production build, which is what both
 * Playwright projects serve.
 */

/** Resolves once a worker is controlling the page. */
async function waitForController(page: Page) {
  await page.waitForFunction(
    () => Boolean(navigator.serviceWorker?.controller),
    undefined,
    { timeout: 15_000 },
  );
}

test("the manifest describes an installable app", async ({ page, baseURL }) => {
  await page.goto("./");

  const href = await page.locator('link[rel="manifest"]').getAttribute("href");
  expect(href).toBeTruthy();

  const response = await page.request.get(new URL(href!, baseURL).toString());
  expect(response.ok()).toBe(true);

  const manifest = (await response.json()) as {
    name: string;
    start_url: string;
    scope: string;
    display: string;
    icons: { src: string; sizes: string; purpose?: string }[];
  };

  expect(manifest.name).toBe("Memory Palace");
  expect(manifest.display).toBe("standalone");
  // Chromium will not offer to install without a raster icon this size.
  expect(manifest.icons.some((icon) => icon.sizes === "512x512")).toBe(true);
  expect(manifest.icons.some((icon) => icon.purpose === "maskable")).toBe(true);

  // Every icon has to actually exist, at the deployed base path.
  for (const icon of manifest.icons) {
    const asset = await page.request.get(new URL(icon.src, baseURL).toString());
    expect(asset.ok(), `${icon.src} should resolve`).toBe(true);
  }

  // start_url and scope must sit under the deployment's base path, or an
  // installed app opens at the wrong place on a project subpath.
  const base = new URL(baseURL!).pathname;
  expect(manifest.start_url.startsWith(base)).toBe(true);
  expect(manifest.scope.startsWith(base)).toBe(true);
});

test("the service worker registers and takes control", async ({ page }) => {
  await openPalace(page, "./");
  await waitForController(page);

  const scriptUrl = await page.evaluate(
    () => navigator.serviceWorker.controller?.scriptURL ?? "",
  );
  // The build stamp is what stops a new deploy reusing the old worker.
  expect(scriptUrl).toMatch(/\/sw\.js\?v=.+/);
});

/**
 * Reaches the state a returning reader is in: the worker installed on the
 * first visit, and now controls the page from the first byte, so everything
 * the app loads passes through it and lands in the cache.
 */
async function becomeReturningVisitor(page: Page, path: string) {
  await openPalace(page, path);
  await waitForController(page);
  await page.reload();
  await waitForController(page);
}

/**
 * Waits until a URL containing `fragment` is in the cache.
 *
 * The worker warms the rest of the shell after it takes control, so being
 * controlled is not the same as being ready to go offline. Waiting on the
 * cache itself is the actual precondition, rather than a sleep long enough to
 * usually work.
 */
async function waitForCached(page: Page, fragment: string) {
  await page.waitForFunction(
    async (needle) => {
      for (const key of await caches.keys()) {
        const cache = await caches.open(key);
        const entries = await cache.keys();
        if (entries.some((request) => request.url.includes(needle)))
          return true;
      }
      return false;
    },
    fragment,
    { timeout: 20_000 },
  );
}

test("the palace still opens with the network cut", async ({ page }) => {
  await becomeReturningVisitor(page, "./");

  await page.context().setOffline(true);
  try {
    await page.reload();
    // The whole shell, not just a document. The greeting is the proof that
    // hydration ran: the server renders "Welcome back" and the client replaces
    // it with the reader's own time of day.
    await expect(page.getByRole("navigation", { name: "Main" })).toBeVisible();
    await expect(
      page.getByRole("heading", { level: 1, name: /Good |Still awake/ }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: /Palace/i }).first(),
    ).toBeVisible();
  } finally {
    await page.context().setOffline(false);
  }
});

test("a room loaded directly offline still renders its objects", async ({
  page,
}) => {
  await becomeReturningVisitor(page, "./palace/");
  await waitForCached(page, "/room");

  const roomHref = await page
    .getByRole("link", { name: /^Open / })
    .first()
    .getAttribute("href");

  await page.context().setOffline(true);
  try {
    // A cold load of a route the reader never opened. The precached room
    // document answers it, and the objects come from local storage.
    await page.goto(roomHref!);
    await expect(objectCards(page).first()).toBeVisible();
  } finally {
    await page.context().setOffline(false);
  }
});

test("clicking through to a room works offline once it has been prefetched", async ({
  page,
}) => {
  await becomeReturningVisitor(page, "./palace/");

  // Next prefetches the room links in view; the worker caches those payloads
  // as they arrive. Waiting for one is the mechanism, not a sleep.
  await waitForCached(page, "/room");

  await page.context().setOffline(true);
  try {
    await openFirstRoom(page);
  } finally {
    await page.context().setOffline(false);
  }
});

test("a change made offline is still there when the network returns", async ({
  page,
}) => {
  await becomeReturningVisitor(page, "./palace/");
  await waitForCached(page, "/palace");

  await page.context().setOffline(true);
  try {
    await page.reload();
    await page.getByRole("button", { name: /add room/i }).click();
    const dialog = page.getByRole("dialog");
    await dialog.getByLabel("Name").fill("Written offline");
    await dialog.getByRole("button", { name: /create room/i }).click();
    await expect(
      page.getByRole("link", { name: "Open Written offline" }),
    ).toBeVisible();
  } finally {
    await page.context().setOffline(false);
  }

  await page.reload();
  await expect(
    page.getByRole("link", { name: "Open Written offline" }),
  ).toBeVisible();
});

test("the worker keeps one cache per build and drops the rest", async ({
  page,
}) => {
  await openPalace(page, "./");
  await waitForController(page);

  const keys = await page.evaluate(() => caches.keys());
  const palaceCaches = keys.filter((key) => key.startsWith("memory-palace-"));

  // Exactly one: a stale second cache is how users end up pinned to an old
  // build with no way to tell.
  expect(palaceCaches).toHaveLength(1);
  expect(palaceCaches[0]).not.toBe("memory-palace-");
});
