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

Every route is a Server Component that renders the page heading and a
`<Suspense>` boundary, and delegates its interactive body to a client component
(`app/palace/PalaceBody.tsx`, and so on). `AppShell` is a Server Component too;
only the parts that genuinely need the client — the active nav link, the mobile
drawer, the save indicator — are islands inside it.

This matters more than it looks. The app used to gate the whole tree behind a
hydration spinner, so the static HTML of every route contained nothing but
"Opening the palace…": nothing to paint, nothing to index, and no way for a
route to describe itself with its own metadata.

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

## Theming

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
fails the build if the total exceeds the budget.

The single largest win was `components/RoomIcon.tsx`, which imported
`lucide-react`'s entire `icons` namespace — around 2,000 icons, untree-shakeable,
on every route. A static map of the thirteen icons the app actually uses took
first load from 359 KB to 209 KB gzip.

The graph is the other hot spot. Its simulation effect keys on a structural
signature (`lib/graph-key.ts`) rather than the object arrays, so renaming an
object repaints its label without re-running the layout; ticks are coalesced to
one state update per animation frame.

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

Accessibility is checked with `@axe-core/playwright` across every route, every
overlay, and both themes, alongside keyboard journeys that automated scans
cannot cover.
