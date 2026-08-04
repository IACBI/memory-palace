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

### Server shell, client islands

Routes are Server Components: heading, metadata, and a `<Suspense>` boundary
around a client body (`app/<route>/<Name>Body.tsx`). `AppShell` is a Server
Component too. Keep it that way — the whole point is that every route's static
HTML contains the real interface, not a spinner.

### Colour is never a string you can append to

`lib/palette.ts` returns `var()` references and `color-mix()` expressions.
Appending anything to one — `` `${color}22` `` — produces CSS that is invalid at
computed-value time and silently renders transparent. This has already cost the
app its entire visual identity once. A guard test in `test/lib/palette.test.ts`
fails on any occurrence, anywhere in the tree.

All colour lives in `app/globals.css`, in two themes. `test/lib/contrast.test.ts`
computes WCAG ratios from those declarations, so a new token that fails contrast
fails the build.

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
