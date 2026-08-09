/**
 * First-load JS budget for the static export.
 *
 * Sums the gzipped size of every script `out/index.html` pulls in. The budget
 * lives in `bundle-budget.json`; when that file is absent the script only
 * reports, so a budget can be committed deliberately after a size change
 * rather than baking in whatever the tree happens to weigh today.
 */
import { readFile, stat } from "node:fs/promises";
import { gzipSync } from "node:zlib";
import { join } from "node:path";

const ROOT = new URL("..", import.meta.url).pathname.replace(
  /^\/([A-Za-z]:)/,
  "$1",
);
const OUT = join(ROOT, "out");
const ENTRY = join(OUT, "index.html");
const BUDGET_FILE = join(ROOT, "bundle-budget.json");

async function readBudget() {
  try {
    const raw = await readFile(BUDGET_FILE, "utf8");
    return JSON.parse(raw).firstLoadGzipBytes ?? null;
  } catch {
    return null;
  }
}

function formatKB(bytes) {
  return `${(bytes / 1024).toFixed(1)} KB`;
}

const html = await readFile(ENTRY, "utf8").catch(() => {
  console.error(
    "check-bundle: out/index.html not found. Run `npm run build:export` first.",
  );
  process.exit(1);
});

// Both `<script src>` and the preload hints Next emits for the same chunks.
const srcs = new Set(
  [...html.matchAll(/(?:src|href)="([^"]+\.js)"/g)].map((m) => m[1]),
);

/**
 * Code that must not reach the first load, keyed by a string literal only that
 * module emits. Minification renames identifiers but keeps string contents, so
 * an accessible name or a piece of visible copy is a stable marker.
 *
 * A budget alone would not catch this: these are interaction-gated overlays
 * split out with `next/dynamic`, and re-importing one statically costs only a
 * few KB — comfortably inside the headroom — while silently undoing the split
 * for every route.
 */
const MUST_BE_SPLIT = [
  ["command palette", "No matches for"],
  ["object editor", "Close editor"],
  ["shortcut cheatsheet", "Press ? at any time"],
  ["graph / d3-force", "alphaTarget"],
];

const files = [];
const leaked = [];
let total = 0;
for (const src of srcs) {
  const rel = src.replace(/^\/memory-palace/, "").replace(/^\//, "");
  const abs = join(OUT, rel);
  try {
    await stat(abs);
  } catch {
    continue;
  }
  const source = await readFile(abs);
  const gz = gzipSync(source).length;
  files.push({ rel, gz });
  total += gz;

  const text = source.toString("utf8");
  for (const [name, marker] of MUST_BE_SPLIT) {
    if (text.includes(marker)) leaked.push({ name, marker, rel });
  }
}

files.sort((a, b) => b.gz - a.gz);
console.log(`First-load JS for / (${files.length} chunks):`);
for (const f of files.slice(0, 10)) {
  console.log(`  ${formatKB(f.gz).padStart(10)}  ${f.rel}`);
}
console.log(`  ${"-".repeat(10)}`);
console.log(`  ${formatKB(total).padStart(10)}  TOTAL (gzip)`);

if (leaked.length > 0) {
  console.error("\nFAIL: code that should be code-split is in the first load:");
  for (const { name, marker, rel } of leaked) {
    console.error(`  ${name} — found "${marker}" in ${rel}`);
  }
  console.error(
    "\nThese are loaded on demand by components/shell/Overlays.tsx and\n" +
      "app/graph/GraphBody.tsx. A static import of one of them undoes that.",
  );
  process.exit(1);
}

const budget = await readBudget();
if (budget === null) {
  console.log(
    `\nNo bundle-budget.json yet. To set one:\n  { "firstLoadGzipBytes": ${total} }`,
  );
  process.exit(0);
}

if (total > budget) {
  console.error(
    `\nFAIL: first-load JS is ${formatKB(total)}, budget is ${formatKB(budget)} (+${formatKB(total - budget)}).`,
  );
  process.exit(1);
}
console.log(
  `\nOK: ${formatKB(total)} of ${formatKB(budget)} budget (${formatKB(budget - total)} headroom).`,
);
