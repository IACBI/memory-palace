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

const files = [];
let total = 0;
for (const src of srcs) {
  const rel = src.replace(/^\/memory-palace/, "").replace(/^\//, "");
  const abs = join(OUT, rel);
  try {
    await stat(abs);
  } catch {
    continue;
  }
  const gz = gzipSync(await readFile(abs)).length;
  files.push({ rel, gz });
  total += gz;
}

files.sort((a, b) => b.gz - a.gz);
console.log(`First-load JS for / (${files.length} chunks):`);
for (const f of files.slice(0, 10)) {
  console.log(`  ${formatKB(f.gz).padStart(10)}  ${f.rel}`);
}
console.log(`  ${"-".repeat(10)}`);
console.log(`  ${formatKB(total).padStart(10)}  TOTAL (gzip)`);

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
