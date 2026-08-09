/**
 * Zero-dependency static server for the `GITHUB_PAGES=true` export in `out/`.
 *
 * The Pages build sets `basePath: "/memory-palace"` and `trailingSlash: true`,
 * so this mirrors what GitHub Pages does: strip the base path, resolve
 * directories to `index.html`, and fall back to `404.html`. Running the E2E
 * suite against this catches export-only breakage that `next start` hides.
 */
import { createServer } from "node:http";
import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { basename, extname, join, normalize, sep } from "node:path";

const ROOT = new URL("../out/", import.meta.url).pathname.replace(
  /^\/([A-Za-z]:)/,
  "$1",
);
const BASE_PATH = "/memory-palace";

/**
 * `--port N` wins over `PORT`, which wins over the default.
 *
 * The flag exists so `playwright.config.ts` can move this server off 4173 the
 * same way it moves `next start` off 3000, in one consistent spelling.
 */
const portFlag = process.argv.indexOf("--port");
const PORT = Number(
  (portFlag !== -1 ? process.argv[portFlag + 1] : undefined) ??
    process.env.PORT ??
    4173,
);

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".webmanifest": "application/manifest+json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".png": "image/png",
  ".woff2": "font/woff2",
  ".txt": "text/plain; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
};

/**
 * Metadata routes export as extensionless files (`out/icon`,
 * `out/opengraph-image`), so they need naming rather than sniffing.
 */
const EXTENSIONLESS_MIME = {
  icon: "image/png",
  "apple-icon": "image/png",
  "opengraph-image": "image/png",
  "twitter-image": "image/png",
};

/** Resolves a URL path to a file inside `out/`, or null if it escapes the root. */
async function resolveFile(urlPath) {
  let rel = decodeURIComponent(urlPath.split("?")[0]);
  if (rel.startsWith(BASE_PATH)) rel = rel.slice(BASE_PATH.length);
  if (rel === "" || rel === "/") rel = "/index.html";

  // Reject traversal before touching the filesystem.
  const safe = normalize(rel).replace(/^([/\\])+/, "");
  if (safe.startsWith("..") || safe.includes(`..${sep}`)) return null;

  let candidate = join(ROOT, safe);
  try {
    const info = await stat(candidate);
    if (info.isDirectory()) candidate = join(candidate, "index.html");
  } catch {
    if (!extname(candidate)) candidate = `${candidate}.html`;
  }

  try {
    const info = await stat(candidate);
    if (info.isFile()) return candidate;
  } catch {
    /* fall through to 404 */
  }
  return null;
}

const server = createServer(async (req, res) => {
  const file = (await resolveFile(req.url ?? "/")) ?? join(ROOT, "404.html");
  let status = 200;
  try {
    await stat(file);
    if (file.endsWith("404.html")) status = 404;
  } catch {
    res.writeHead(404, { "content-type": "text/plain" });
    res.end("Not found");
    return;
  }
  const extension = extname(file);
  const contentType = extension
    ? (MIME[extension] ?? "application/octet-stream")
    : (EXTENSIONLESS_MIME[basename(file)] ?? "application/octet-stream");

  res.writeHead(status, {
    "content-type": contentType,
    "cache-control": "no-store",
  });
  createReadStream(file).pipe(res);
});

server.listen(PORT, () => {
  console.log(`Serving out/ at http://localhost:${PORT}${BASE_PATH}/`);
});
