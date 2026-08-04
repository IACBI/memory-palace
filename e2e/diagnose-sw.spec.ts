import { test } from "@playwright/test";
import { openPalace } from "./helpers";

/**
 * TEMPORARY. Delete once the CI-only offline failure is understood.
 *
 * Six `offline.spec.ts` tests fail on the `export` project on GitHub's runners
 * and nowhere else: not on Windows, not in the matching Playwright container on
 * Linux under Node 22 or 24, not with the whole suite under `workers: 1`, not
 * with both builds sharing a build id. The worker fetches its script, the start
 * document and every asset within ~70ms, then goes silent and never becomes the
 * controller — which does not look like slowness, it looks like `install`
 * rejecting and the worker being discarded.
 *
 * This records what the runner sees. It never fails; it only reports, so a red
 * run stays attributable to the real tests.
 */

type Snapshot = {
  t: number;
  controller: string | null;
  registrations: {
    scope: string;
    installing: string | null;
    waiting: string | null;
    active: string | null;
  }[];
};

test("diagnose: service worker lifecycle and storage", async ({
  page,
}, testInfo) => {
  const label = `[${testInfo.project.name}]`;

  await openPalace(page, "./");

  const context = await page.evaluate(() => ({
    secureContext: window.isSecureContext,
    origin: window.location.origin,
    href: window.location.href,
    hasServiceWorker: "serviceWorker" in navigator,
  }));
  console.log(`${label} context: ${JSON.stringify(context)}`);

  const estimate = await page.evaluate(async () => {
    if (!navigator.storage?.estimate) return null;
    const e = await navigator.storage.estimate();
    return { quota: e.quota ?? null, usage: e.usage ?? null };
  });
  console.log(`${label} storage.estimate: ${JSON.stringify(estimate)}`);

  // A worker that reaches `redundant` without ever going `activated` is one
  // whose install rejected. That is the single distinguishing observation.
  const timeline: Snapshot[] = [];
  const started = Date.now();
  for (let i = 0; i < 16; i++) {
    const snapshot = await page.evaluate(async () => {
      const regs = await navigator.serviceWorker.getRegistrations();
      return {
        controller: navigator.serviceWorker.controller?.scriptURL ?? null,
        registrations: regs.map((r) => ({
          scope: r.scope,
          installing: r.installing?.state ?? null,
          waiting: r.waiting?.state ?? null,
          active: r.active?.state ?? null,
        })),
      };
    });
    timeline.push({ t: Date.now() - started, ...snapshot });
    if (snapshot.controller) break;
    await page.waitForTimeout(1000);
  }

  for (const entry of timeline) {
    console.log(`${label} t=${entry.t}ms ${JSON.stringify(entry)}`);
  }

  // Whatever the registration promise says, said out loud.
  const registration = await page.evaluate(async () => {
    try {
      const reg = await navigator.serviceWorker.ready;
      return {
        ready: true,
        scope: reg.scope,
        active: reg.active?.state ?? null,
      };
    } catch (error) {
      return { ready: false, error: String(error) };
    }
  });
  console.log(`${label} serviceWorker.ready: ${JSON.stringify(registration)}`);

  const caches = await page.evaluate(async () => {
    if (!("caches" in window)) return { error: "no CacheStorage" };
    try {
      const keys = await window.caches.keys();
      const sizes: Record<string, number> = {};
      for (const key of keys) {
        const cache = await window.caches.open(key);
        sizes[key] = (await cache.keys()).length;
      }
      return { keys, sizes };
    } catch (error) {
      return { error: String(error) };
    }
  });
  console.log(`${label} caches: ${JSON.stringify(caches)}`);
});
