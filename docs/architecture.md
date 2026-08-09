# Architecture

Written for someone about to change this codebase. English only, by design —
the README carries the user-facing text in eight languages; this does not.

Author: 𝓐.𝓒.𝓑

## Shape of the app

Memory Palace is a local-first spatial notebook. Every byte of a user's palace
lives in their browser. There is no server, no account, and no network call.

```
app/            routes; each is a Server Component + a client body island
components/     ui primitives, feature components, shell, providers
lib/            types, store, storage adapters, pure helpers
e2e/            Playwright specs, run against both deploy targets
test/           Vitest unit and component tests
```

### Server shell, client islands

Every route is a Server Component that renders the page heading and delegates
its interactive body to a client component (`app/palace/PalaceBody.tsx`, and so
on). `AppShell` is a Server Component too; only the parts that genuinely need
the client — the active nav link, the sidebar, the drawer, the save indicator,
the global overlays — are islands inside it.

Navigation has three tiers: a drawer below `md`, a 64px icon rail from `md`, and
the full 256px sidebar from `lg`, which the reader can collapse back to the
rail. `components/shell/Sidebar.tsx` owns that preference and renders the
`<aside>` itself — `e2e/responsive.spec.ts` locates it as `body > div > aside`
and measures exactly 64 and 256, so nothing may wrap it. The preference is read
with `useSyncExternalStore`, whose server snapshot is always "expanded": that is
what keeps the hydrated markup identical to the HTML while still applying a
stored choice in the same pass.

Those bodies show a shaped skeleton (`components/skeletons/RouteSkeletons.tsx`)
while `useHydrated()` is false, rather than sitting behind a `<Suspense>`
boundary: the palace is read from `localStorage` on the client, which is not a
promise React can suspend on. `app/room/page.tsx` is the one exception and does
use `<Suspense>`, because `RoomView` calls `useSearchParams()` — the room id
travels as `?r=<id>` so the app can export statically and still open a room
created after build time.

This matters more than it looks. The app used to gate the whole tree behind a
hydration spinner, so the static HTML of every route contained nothing but
"Opening the palace…": nothing to paint, nothing to index, and no way for a
route to describe itself with its own metadata.

### The canvas routes

The palace, a room and the graph show a _place_. All three used to sit in the
same padded reading column as the library and the settings page — a `3:2` card,
a `64vh` box beside a legend column — with a heading above pushing them down.
They now use `components/shell/CanvasStage.tsx`, which is
`h-[calc(100svh-var(--shell-header))]`: exactly what the shell leaves. Their
titles, room legend, zoom stack and room actions float over the canvas instead
of stacking above it, which is also why each still renders a real, visible `h1`
— `e2e/smoke.spec.ts` checks every route has one and `e2e/onboarding.spec.ts`
checks it with JavaScript disabled.

`--shell-header` (declared with the other non-colour tokens) is the single
source of the top bar's height: `AppShell`'s header is `h-[var(--shell-header)]`
and every stage measures against it, so the two cannot drift.

Fullscreen — `F`, or the button in each canvas's control cluster — hides the
header and the sidebar too. It is an attribute on the document element,
`data-immersive`, not a store flag, for the same reason `data-theme` is: the
chrome it hides lives in a Server Component that must not subscribe to React
state. `lib/immersive.ts` is the only writer, `app/globals.css` has the two
rules, and one of them sets `--shell-header: 0rem` — which is the entire resize
path, with no JavaScript in it. Escape leaves the mode through
`lib/overlay-stack.ts` like every other dismissal, and navigating away leaves it
too: landing on the library with no navigation would be a dead end.

`svh` rather than `vh` throughout. On a phone `100vh` is the viewport at its
_largest_, so `100vh - 4rem` overflows behind the browser's own bar and the page
scrolls a little with nothing on screen to explain why.

### State and persistence

`lib/store.ts` is a single Zustand store holding the whole `PalaceData`
document plus UI state. Every mutating action:

1. runs inside `withHistory`, which snapshots the document for undo;
2. stamps timestamps and appends an activity event;
3. schedules a debounced save.

`lib/persistence.ts` owns the save. It flushes on `pagehide` and
`visibilitychange` — not `beforeunload`, which is unreliable on mobile Safari
and Chrome for Android. Without that flush, a room created and then reloaded
within the debounce window was simply gone.

`lib/storage/adapter.ts` defines a `StorageAdapter`; `LocalStorageAdapter`
implements it. Reads are validated by `lib/storage/validate.ts`, and a corrupt
document throws `CorruptPalaceError` rather than being treated as an empty
palace — the difference between showing a recovery screen and silently
overwriting someone's work.

### Undo

`lib/history.ts` keeps up to 50 snapshots. Because the store replaces only the
collections it changes, untouched arrays are shared by reference and fifty
snapshots cost kilobytes; a test asserts that sharing rather than assuming it.
Edits to the same target within 800 ms coalesce into one step, so typing a
title is one undo, not forty.

## UI primitives

`components/ui/` holds the shared building blocks: `Card` (the recurring
raised surface — dashboard panels, room chambers, object cards, library rows —
previously copy-pasted into four screens, which is how three of them ended up
with slightly different hover treatments), `Menu` (the ARIA menu-button
pattern — Escape through `lib/overlay-stack.ts`, `pointerdown` dismissal so
touch and pen work, focus returning to the trigger, arrow keys via
`useRovingTabIndex` — previously hand-built once, inside `RoomChamber`, so
every one of those details had to be reproduced by hand at the next call
site), and `IconButton` (a small visible box with `.hit-area` expanding the
actual target to `--hit-min`, replacing six near-identical hand-rolled icon
buttons, none of which reached 44px on a touch screen).

`lib/cn.ts` joins class names — six lines, deliberately not `clsx` +
`tailwind-merge`. Classes in this app compose in one direction only (a
component's own classes first, the caller's `className` last), so the later
declaration always wins by CSS source order and there is nothing for a merge
step to resolve; two dependencies and ~8 KB were not worth it against the
bundle budget.

## Theming

"Eşik" (threshold) — the interface as a place with one light in it.

The ground is cool neutral graphite and everything that matters is warm,
because it is lit: dark theme `palace` (base `#0f0f11`, surface `#17171a`,
text `#eeeae4`, accent `#f0b775`), light theme `parchment` (base `#f1ece3`,
surface `#faf6ef`, text `#1a1815`, accent `#8a4f16`). The cool-room /
warm-light pairing is the whole idea, and it is why the dark theme is
deliberately _not_ indigo — a blue ground plus a blue accent reads as a colour
scheme rather than as an unlit space.

Parchment is not a lightness-inverted `palace`: flipping the channel gives a
flat grey with none of its character, so the light theme is the same room with
the shutters open — warm plaster and daylight — and the accent inverts from a
light fill with a dark label to a dark fill with a pale one.

Display type is Syne (`--font-display`), body text Instrument Sans
(`--font-sans`), both variable and self-hosted via `next/font/google`. Syne is
wide and eccentric enough to be tiring below ~20px, so it is confined to page
titles, the brand and the large counts; everything anyone actually reads is
Instrument Sans. Numerals that share a column (`relativeTime`, object counts)
carry the `.tabular` utility so they stop twitching as they change.

The signature is the **threshold** (`.threshold` in `globals.css`): a room
drawn as a doorway. At rest, a short tick of the room's pigment at the leading
edge; on hover or focus-within, the tick grows to a full jamb and the room's
light spills across the band. Both layers are pseudo-elements at `z-index: -1`
inside an `isolation: isolate` context, so neither can intercept a pointer or
reach the accessibility tree. `RoomThreshold` (the dashboard's doorway list)
and `RoomChamber` (the floor plan's positioned volumes) both wear it, fed by
`thresholdVars()` from `lib/palette.ts`.

Room palettes (`brass | oxblood | forest | ink | plum | umber`) and accent
hues (`brass | copper | sage | slate`) are **keys, not colours**. Both sets of
strings are persisted inside every saved `PalaceData` document, and
`validatePalaceData` rejects anything outside the fixed set — so this
rebuild's entire re-hue was a change to the six-and-four hex values _behind_
each key, never to the keys themselves. No migration was needed, and a palace
saved under the older candlelit and Observatory identities loads and repaints
under this one untouched. Under Eşik all four accent labels in
`lib/settings.ts` happen to match their keys again; that is a coincidence of
this repaint, not a rule. Do not rename a key to match its current colour;
they are allowed — expected — to drift apart over time.

All colour lives in CSS custom properties in `app/globals.css`. `lib/palette.ts`
returns `var()` references and `color-mix()` expressions and **never** a value
that can be concatenated:

```ts
paletteTint("brass", "chip");
// color-mix(in srgb, var(--palette-brass) 14%, transparent)
```

The rule exists because the previous API returned `"var(--palette-brass)"` and
seventeen call sites appended a hex alpha to it. Custom property substitution
is token-based, so `var(--palette-brass)14` is invalid at computed-value time
and falls back to transparent. Every room tint, glow and icon chip in the app
was invisible. A guard test now fails on any `var(--…)` followed by a hex digit
or a percent sign anywhere in the source tree.

Two themes, `palace` (dark) and `parchment` (light), are selected by
`data-theme` on `<html>`. `auto` is resolved to one of the two by the inline
bootstrap script in `<head>` before first paint, so the stylesheet only ever
has one thing to key off. `test/lib/contrast.test.ts` computes WCAG ratios from
the declarations themselves, in both themes.

Non-colour scales live in the same file but deliberately outside the
`--palace-`/`--palette-` prefix, so the theme-parity rule above does not sweep
them in — they do not vary by theme and must not be redeclared under
`[data-theme="parchment"]`. That covers a type scale (`--text-2xs` through
`--text-5xl`; `--text-2xs` at 0.6875rem replaced 23 hand-written
`text-[11px]`, and `--text-5xl` at 4rem exists because Eşik carries each
screen on one large display line), `--radius-sm` through `--radius-xl`, a
`--z-raised | sticky | drawer | overlay | toast` stacking scale (replacing
nine ad hoc values spread between `z-0` and `z-[80]`), the motion system
below, `--hit-min: 44px`, consumed by the `.hit-area` utility that expands
a control's tap target with a centred pseudo-element rather than growing the
control itself, and `--shell-header`, which the canvas routes size themselves
against. Every interactive element clears 44px except inline
tag-remove buttons, which stay 24px — WCAG 2.5.8 exempts inline targets, and
44px there would overlap neighbouring tags and swallow their clicks.

Motion is one easing family and four durations, plus `--motion-distance-sm|md|
lg|full` and `--motion-stagger`. Screens arrive with `.page-enter` (rise and
a barely-perceptible scale — movement towards the reader, not a slide from the
side); bounded lists deal themselves out with `.arrive-item`, which reads
`--i` from the call site. **Cap `--i` where you set it.** An uncapped stagger
is both bad design and a test hazard: `e2e/helpers.ts` waits for every finite
animation to finish before scanning, so a hundred rows at 45ms each stalls the
axe pass. Hover and focus feedback goes through the `transition-quiet` and
`transition-lift` utilities rather than ad hoc Tailwind durations, so the
whole app's timing is set in one place. Reduced motion — OS preference or the
in-app toggle — collapses the distance and stagger variables and shortens the
long entrances, leaving opacity and colour feedback intact.

Shadows are the one exception to that split: `--palace-shadow-raise`,
`--palace-shadow-overlay` and `--palace-shadow-spill` (the warm pool a lit
surface throws) carry the `--palace-` prefix on purpose, because a
light ground casts where a dark one glows, so they _do_ vary by theme and
_are_ redeclared under `[data-theme="parchment"]`.

**Never give a `--color-*` token the same name as a `--text-*` step.**
Tailwind's `text-*` utility namespace is served by both, so a colour called
`base` and the type scale's `base` step both compile to a `.text-base` rule —
and the colour wins. Every `text-base` in the app was silently setting
`color: var(--palace-base)`: near-black text on a near-black ground, which
`@axe-core/playwright` caught at a contrast ratio of 1.05:1 across five
routes. Nothing looked wrong in the type scale, because 1rem is the inherited
default anyway. The colour alias is now `ground` (`bg-ground`,
`border-ground`); `--palace-base`, which `test/lib/contrast.test.ts` parses,
was not touched. There is a comment at the head of the `@theme inline` block
in `app/globals.css` saying so.

## Security

The app never renders user data as HTML, never uses `dangerouslySetInnerHTML`
for anything but the theme bootstrap, and allow-lists URL schemes at both
validation and render time (`lib/storage/url.ts`).

Content Security Policy is expressed once in `lib/security-headers.ts` and
delivered twice, because the two deploy targets differ:

|                   | Server build | Static export                               |
| ----------------- | ------------ | ------------------------------------------- |
| Delivery          | Real headers | `<meta http-equiv>`                         |
| `frame-ancestors` | Enforced     | **Ignored** — meta form does not support it |
| `X-Frame-Options` | Sent         | Not possible                                |

**Clickjacking protection is genuinely absent on GitHub Pages.** That is a
property of static hosting, not an oversight, and it is stated here rather than
implied away.

`'unsafe-inline'` in `script-src` is unavoidable: Next's own RSC bootstrap
emits inline `self.__next_f.push(...)`, and the theme script has to run before
first paint. Nonces are the documented alternative but force every page to
render dynamically, which a static export cannot do.

## Offline

`public/sw.js` is hand-written — the whole policy is forty lines, and the
failure mode of a caching layer nobody understands on a static host is users
pinned to a stale build with no way to tell.

- The cache name carries a build id, passed in the registration URL
  (`/sw.js?v=…`). A new build changes the script URL, so a new worker installs
  rather than the byte-identical old one being reused.
- Install precaches only the start URL and the assets its HTML references.
  The rest of the shell warms up after activation, so taking control is never
  delayed by fetching the whole app.
- Chunk filenames contain a build hash and cannot be listed in advance, so
  `precacheDocument` reads them out of the HTML it is already fetching.
- Navigations fall back to the cache ignoring the query string: `/room/?r=<id>`
  is one prerendered document that resolves its id on the client. Data payloads
  must not do this — for those the query is the whole difference.
- A waiting worker never activates on its own. It takes over when the reader
  accepts the update toast.

## Performance

The bundle is guarded by `scripts/check-bundle.mjs` against
`bundle-budget.json`: it gzips every chunk referenced by `out/index.html` and
fails the build if the total exceeds the budget — 235,000 B. First load for
`/` currently sits at 219,040 B, roughly 7% of headroom; raise the budget
deliberately, with a note on what grew, rather than loosening it to make a
build pass.

The historical big win was `components/RoomIcon.tsx`, which used to import
`lucide-react`'s entire `icons` namespace — around 2,000 icons, untree-shakeable,
on every route. A static map of the thirteen icons the app actually uses
(`lib/icon-set.ts`) took first load from 359 KB to 209 KB gzip.

`next.config.ts` deliberately does not list `lucide-react` under
`experimental.optimizePackageImports`. It would be a no-op: `lucide-react` is
one of the packages Next optimises by default — the list is in
`node_modules/next/dist/docs/01-app/03-api-reference/05-config/01-next-config-js/optimizePackageImports.md`,
which is the thing to check before adding any package to that array.

Code-splitting is the current lever, and it is new — the tree had zero
`next/dynamic` before this rebuild. `components/shell/Overlays.tsx`, mounted
by every route, lazily loads three overlays — `CommandPalette`, `ObjectEditor`,
`ShortcutsDialog` — that previously shipped in every first load: roughly a
thousand lines, plus the search index and the whole shortcut table, for a
reader who had not pressed anything yet. The Ctrl/Cmd+K and `?` keydown
listeners deliberately stay in the always-loaded part of that file rather than
inside the components they open, so the very first press of either key still
works before the relevant chunk has arrived. `app/graph/GraphBody.tsx` does
the same for `GraphView`, so `d3-force` — used nowhere else — leaves the
shared chunk entirely. Together these were worth 7.8 KB gzip on `/`'s first
load (221.7 KB unsplit → 213.9 KB); the new primitives and responsive markup
then added their own weight on top, landing at the 219,040 B above.

The graph is the other hot spot. Its simulation effect keys on a structural
signature (`lib/graph-key.ts`) rather than the object arrays, so renaming an
object repaints its label without re-running the layout; ticks are coalesced to
one state update per animation frame. Because that still re-renders the whole
view every frame while the layout settles, anything read during its render has
to be O(1) — the rooms sidebar counts objects from a memoised map rather than
filtering the array per room.

Its `viewBox` tracks the measured container instead of being fixed at 960×640.
A fixed box is scaled to _fit_ by the default `preserveAspectRatio`, so in a
wide, short container the whole graph drew at whatever fraction the height
allowed — about 79% on a laptop — letterboxed with dead space down both sides.
Measuring means the SVG's user space is CSS pixels: one node is one size at any
window, and the canvas is always full. The measurement is mirrored into a ref so
`fitToView` keeps a stable identity; it sits in the simulation effect's
dependency list, and a new identity per resize would tear the layout down and
re-run it.

## Testing

| Gate                   | What it covers                                           |
| ---------------------- | -------------------------------------------------------- |
| `npm run test:run`     | Pure logic, storage validation, contrast, palette guards |
| `npm run test:e2e`     | Both deploy targets, in parallel Playwright projects     |
| `npm run check-bundle` | First-load gzip budget                                   |

The E2E suite runs twice: against `next start` and against the static export
served from `out/` under its base path. Export-only breakage — base-path URLs,
anything that needs a server — is invisible to the first and caught by the
second.

`e2e/helpers.ts` holds `scan()` — an axe pass that waits for entrance
animations to finish first, so mid-flight opacity is never scored as a
contrast failure, with infinite animations like skeleton shimmers excluded so
the wait can actually resolve — and `ROUTES`, the five fixed routes scanned in
both themes. `a11y.spec.ts` and `theme.spec.ts` each used to carry a verbatim
copy of both; lifting them out removed the two-places-to-update problem and
`e2e/probe.spec.ts`, a debug leftover with zero assertions that ran in both
Playwright projects in CI for no reason, was deleted outright.

`playwright.config.ts` reads `PW_SERVER_PORT` / `PW_EXPORT_PORT` (default
3000 / 4173, matching CI) so a local run can move `next start` and the export
server off those ports, e.g. `PW_SERVER_PORT=3100 npx playwright test`.
`reuseExistingServer` is on outside CI, so without this, whatever already
answers on 3000 — another project's dev server — is what the `server` project
tests, reading as roughly 85 confusing product bugs instead of the port
collision it is. `scripts/serve-export.mjs` takes a matching `--port` flag.
CI passes neither variable and keeps the defaults.

Accessibility is checked with `@axe-core/playwright` across every route, every
overlay, and both themes, alongside keyboard journeys that automated scans
cannot cover.
