<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

<!-- END:nextjs-agent-rules -->

## Memory Palace

A local-first spatial notebook. No server, no account, no network call — every
byte of a user's palace lives in their browser.

[`docs/architecture.md`](docs/architecture.md) is the long version. What follows
is what most often gets broken by someone who has not read it.

### Two deploy targets, always both

`npm run build` produces the server-capable build; `GITHUB_PAGES=true` produces
a static export under the `/memory-palace` base path. They differ in ways that
are invisible until they are not:

- `headers()` is a **no-op** under `output: "export"`. The CSP travels in a
  `<meta http-equiv>` there, which cannot express `frame-ancestors`.
- Root-relative URLs written by hand will 404 on the subpath. Next prefixes the
  ones it generates — except `app/icon.tsx`'s link tag, which is why
  `metadata.icons` is declared explicitly in the root layout.
- The export uses trailing slashes; the server build does not.

`npm run test:e2e` builds the export **first** and the server build **second**,
then runs Playwright against both. Running the builds in the other order leaves
`next start` serving the export, and roughly thirty tests fail with confusing
base-path URLs. That is a mistake in how you invoked it, not a product bug.

`playwright.config.ts` also reads `PW_SERVER_PORT` / `PW_EXPORT_PORT` (default
3000 / 4173, unchanged for CI) to move the `server`/`export` projects off
those ports for a local run. `reuseExistingServer` is on outside CI, so if
another project's dev server already holds 3000, the whole `server` project
silently tests a stranger's HTML instead of failing to start — roughly 85
tests fail and look like product bugs. `PW_SERVER_PORT=3100 npx playwright
test` sidesteps it; `scripts/serve-export.mjs` takes a matching `--port` flag.

### Server shell, client islands

Routes are Server Components: heading, metadata, and a `<Suspense>` boundary
around a client body (`app/<route>/<Name>Body.tsx`). `AppShell` is a Server
Component too. Keep it that way — the whole point is that every route's static
HTML contains the real interface, not a spinner.

`components/shell/Overlays.tsx`, which `AppShell` mounts once, lazily loads
`CommandPalette`, `ObjectEditor` and `ShortcutsDialog` with `next/dynamic` —
they used to ship on every route's first load. The Ctrl/Cmd+K and `?` keydown
listeners must stay in the always-loaded part of that file, not moved into the
lazily-loaded components: that is what lets the very first keypress work
before the relevant chunk has arrived. `app/graph/GraphBody.tsx` does the same
for `GraphView`, keeping `d3-force` out of the shared chunk. If you add a
fourth global overlay, split it the same way — do not add it directly to
`Overlays.tsx`'s render and undo the point of the split.

### Three routes are canvases, not documents

`/palace`, `/room` and `/graph` wrap their body in
`components/shell/CanvasStage.tsx` and fill the shell's content area exactly.
Their chrome — page title, the graph's room legend, a room's back link and
actions — **floats over** the canvas; nothing goes above it and pushes it down,
which is what the redesign was for. Each of those overlays still renders a real,
visible `h1`: `e2e/smoke.spec.ts` asserts one per route and
`e2e/onboarding.spec.ts` asserts it with JavaScript off, so moving a title into
an `sr-only` span or a client component breaks both.

`--shell-header` in `app/globals.css` is the only place the top bar's height is
written. `AppShell`'s header reads it and every stage subtracts it — do not
type `4rem` or `h-16` at a call site again.

Fullscreen (`F`) is `data-immersive` on the document element, written only by
`lib/immersive.ts`, with two rules in `app/globals.css`; one sets
`--shell-header: 0rem` and that is the whole resize path. It is deliberately not
a store flag — `AppShell` and `Sidebar` carry the `data-shell-chrome` attribute
that CSS hides, which is what lets `AppShell` stay a Server Component. Sizing is
`svh`, never `vh`.

### Reach for the shared primitive, don't hand-roll one

`components/ui/` has `Card`, `Menu`, `IconButton` and `SectionLabel` alongside
the older `Button`, `Dialog`, `Input`. `Menu` implements the full ARIA
menu-button pattern — Escape through `lib/overlay-stack.ts`, `pointerdown`
dismissal, focus return to the trigger, roving tabindex — and used to be
hand-built once, inside `RoomChamber`; a new dropdown that reimplements this
from scratch instead of using `Menu` will be missing at least one of those
details. Class composition goes through `lib/cn.ts` (six lines, deliberately
not `clsx` + `tailwind-merge` — see the comment in the file for why); do not
add a merge library to fix an ordering bug, fix the call-site order instead.

Hover and focus feedback goes through the `transition-quiet` /
`transition-lift` utilities in `app/globals.css`, never a bare
`transition-colors duration-200`. The point is that the timing of the entire
interface is one edit, not ninety.

### The threshold is the signature — don't reinvent it

A room rendered as a doorway (`.threshold`) is the one memorable thing in this
interface. `RoomThreshold` uses it for the dashboard's doorway list and
`RoomChamber` for the floor plan's positioned volumes; both get their colours
from `thresholdVars()` in `lib/palette.ts`. Its light and its jamb are
pseudo-elements at `z-index: -1` inside an `isolation: isolate` context —
that is what keeps them out of the pointer path and the accessibility tree, so
a hand-rolled version with real elements will break one or both.

Spend the boldness there and nowhere else. Cards, rows and list items are
deliberately quiet; a second competing flourish is what turns a designed
interface back into a templated one.

Staggered arrivals (`.arrive-item`) read `--i` from the call site. **Cap it
where you set it** — `e2e/helpers.ts` waits for every finite animation to
finish before it scans, so an uncapped stagger on a long list both looks wrong
and stalls the axe pass.

### Colour is never a string you can append to

`lib/palette.ts` returns `var()` references and `color-mix()` expressions.
Appending anything to one — `` `${color}22` `` — produces CSS that is invalid at
computed-value time and silently renders transparent. This has already cost the
app its entire visual identity once. A guard test in `test/lib/palette.test.ts`
fails on any occurrence, anywhere in the tree.

All colour lives in `app/globals.css`, in two themes. `test/lib/contrast.test.ts`
computes WCAG ratios from those declarations, so a new token that fails contrast
fails the build.

Colour is not the only tokenised axis. `app/globals.css` also defines a type
scale, `--radius-*`, a `--z-raised|sticky|drawer|overlay|toast` stacking
scale, the motion system (`--duration-*`, `--ease-*`, `--motion-distance-*`,
`--motion-stagger`), and `--hit-min: 44px` — all deliberately spelled without the
`--palace-`/`--palette-` prefix, because unlike colour they do **not** vary by
theme and must not be redeclared under `[data-theme="parchment"]`. Separately
again: room palette keys (`brass | oxblood | forest | ink | plum | umber`) and
accent keys (`brass | copper | sage | slate`) are storage identifiers
persisted inside every saved palace, not colours — `validatePalaceData`
rejects anything outside that fixed set. Re-hue the values behind a key freely;
never rename the key itself, and never assume the key still describes its
current colour. Shadows are the exception to the prefix rule: a light ground
casts where a dark one glows, so `--palace-shadow-raise` / `-overlay` are
prefixed and redeclared per theme like any colour.

**Never give a `--color-*` token the same name as a `--text-*` step**
(`xs`, `sm`, `base`, `lg`, …). Tailwind's `text-*` namespace is served by
both, so the two compile to the same `.text-*` rule and the colour wins. A
colour called `base` made every `text-base` in the tree set
`color: var(--palace-base)` — near-black on near-black, 1.05:1, caught only by
the axe scan. That alias is now `ground`; the comment at the top of the
`@theme inline` block in `app/globals.css` explains why. This failure is
silent: no build warning, no type error.

### Things that are load-bearing

- **`lib/persistence.ts`** flushes on `pagehide` and `visibilitychange`, never
  `beforeunload`. Removing that loses work on mobile.
- **`lib/overlay-stack.ts`** routes every Escape to the topmost overlay. Adding
  a `window` keydown listener in a component instead reintroduces the bug where
  one Escape closed two dialogs.
- **`withHistory` in `lib/store.ts`** wraps every mutation. A new action that
  skips it is a change the user cannot undo.
- **`public/sw.js`** is hand-written and commented at length. Read those
  comments before touching it; the failure mode is users pinned to a stale
  build with no way to tell.

### Gates

`format:check` → `lint` → `typecheck` → `test:run` → `build:export` →
`check-bundle` → `build` → `test:e2e`. All of them run in CI, and `deploy.yml`
needs `ci` to pass first.

Do not weaken a test to make it pass, and do not suppress a lint rule — the
`react-hooks/exhaustive-deps` suppression that used to live in
`CommandPalette.tsx` was removed by restructuring the component, not by
re-approving it.
