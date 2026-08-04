/**
 * Memory Palace offline worker.
 *
 * The app is entirely local-first — every byte of a user's palace lives in
 * this browser — so being unusable without a network was the one place the
 * product contradicted itself.
 *
 * Hand-written rather than generated. The whole file is forty lines of policy,
 * and the failure mode of a caching layer you do not understand on a static
 * host is users pinned to a stale build with no way to tell them.
 *
 * ## Staleness
 *
 * The cache name carries the build id, which the page passes in the
 * registration URL (`/sw.js?v=<build>`). A new build therefore:
 *
 *   1. changes the script URL, so the browser fetches and installs a new
 *      worker rather than reusing the byte-identical old one;
 *   2. writes to a new cache, leaving the old one untouched for any tab still
 *      running the previous worker;
 *   3. deletes every other cache on activation, once no tab needs them.
 *
 * The new worker waits rather than taking over: it activates when the page
 * sends `SKIP_WAITING`, which happens when the reader accepts the update
 * prompt. Swapping the code under a page mid-session is how a "refresh loses
 * my work" bug gets written.
 */

const BUILD = new URL(self.location.href).searchParams.get("v") || "dev";
const CACHE = `memory-palace-${BUILD}`;

/**
 * Documents worth having before they are ever asked for.
 *
 * Both spellings of each route: the static export uses trailing slashes and
 * the server build does not, and a redirect makes `cache.add` throw. Misses
 * are tolerated, so listing the form this deployment does not use is free.
 *
 * `/room` covers every room: one prerendered document that reads which room
 * to show from its query string on the client.
 *
 * Each of these is precached together with the assets it references — see
 * `precacheDocument` — so the whole app is available offline after one visit,
 * not just the routes that visit happened to touch.
 *
 * Split into two passes. Installation waits only for the start URL, because a
 * worker does not control anything until it has installed, and fetching all
 * eleven documents plus every chunk they reference first put that several
 * seconds away on a slow connection. The rest warms up after activation,
 * where nothing is waiting on it.
 */
const START = [""];

const REST = [
  "palace/",
  "palace",
  "library/",
  "library",
  "graph/",
  "graph",
  "settings/",
  "settings",
  "room/",
  "room",
];

/** Any `/_next/static/…` URL appearing in an attribute or a script string. */
const ASSET_PATTERN = /["'(]([^"'()\s]*\/_next\/static\/[^"'()\s]+)["')]/g;

/**
 * Caches a document and everything it loads to run.
 *
 * The chunk filenames contain a build hash, so they cannot be listed here —
 * but they are written into the HTML, which this worker is about to fetch
 * anyway. Reading them out is what makes a route work offline before the
 * reader has ever opened it; without it they get a document and a skeleton
 * that never fills in.
 */
async function precacheDocument(cache, url) {
  const response = await fetch(url);
  if (!response.ok) return;
  await cache.put(url, response.clone());

  const html = await response.text();
  const assets = new Set();
  for (const [, href] of html.matchAll(ASSET_PATTERN)) {
    assets.add(new URL(href, url).href);
  }
  await Promise.all(
    [...assets].map((asset) => cache.add(asset).catch(() => undefined)),
  );
}

/** Precaches a list of shell paths. Individual failures are tolerated. */
async function precacheAll(paths) {
  const cache = await caches.open(CACHE);
  await Promise.all(
    paths.map((path) =>
      precacheDocument(
        cache,
        new URL(path, self.registration.scope).href,
      ).catch(() => undefined),
    ),
  );
}

self.addEventListener("install", (event) => {
  event.waitUntil(precacheAll(START));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key.startsWith("memory-palace-") && key !== CACHE)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim())
      // Only after claiming: the pages waiting to be controlled should not
      // queue behind the rest of the app being fetched.
      .then(() => precacheAll(REST)),
  );
});

self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") self.skipWaiting();
});

/**
 * Immutable build assets: serve from cache, refresh in the background.
 * Their URLs contain a content hash, so a cached copy is never wrong.
 */
async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE);
  const cached = await cache.match(request);
  const network = fetch(request)
    .then((response) => {
      if (response.ok) cache.put(request, response.clone());
      return response;
    })
    .catch(() => cached);
  return cached || network;
}

/**
 * Everything else: try the network, fall back to the cache.
 *
 * The other way round would serve yesterday's HTML to an online reader, which
 * on a static host means yesterday's JavaScript bundle references too.
 */
async function networkFirst(request) {
  const cache = await caches.open(CACHE);
  try {
    const response = await fetch(request);
    if (response.ok) cache.put(request, response.clone());
    return response;
  } catch (error) {
    // Navigations ignore the query string. `/room/?r=<id>` is one prerendered
    // document that reads its id on the client, so an exact match would miss
    // the precached copy for every room there is. Data payloads must NOT do
    // this: for those the query is the whole difference between two responses.
    const cached = await cache.match(
      request,
      request.mode === "navigate" ? { ignoreSearch: true } : undefined,
    );
    if (cached) return cached;

    // Any page of this app boots the same client-side shell, so the start URL
    // is a truthful offline answer for a route that was never visited. Only
    // for a real navigation, though — handing a document to something that
    // asked for a data payload turns a clean failure into a parse error.
    if (request.mode === "navigate") {
      const start = await cache.match(new Request(self.registration.scope));
      if (start) return start;
    }
    throw error;
  }
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (url.pathname.includes("/_next/static/")) {
    event.respondWith(staleWhileRevalidate(request));
    return;
  }

  // Everything else the app asks for on its own origin: documents, the RSC
  // payloads behind client-side navigation, icons, the manifest.
  //
  // Navigations alone are not enough. Moving between routes without a reload
  // fetches a payload that is neither a navigation nor a hashed static asset,
  // so leaving those to the network meant the app loaded offline and then
  // failed the moment the reader clicked a room.
  event.respondWith(networkFirst(request));
});
