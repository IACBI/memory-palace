<div align="center">

# 🏛️ Memory Palace

### A spatial home for everything you know.

Organise knowledge as **rooms** (topics) and **objects** (notes, links, ideas, and file
references) inside a visual, dark, atmospheric mansion — then search it, connect related
pieces, and explore the web of ideas as a graph.

**[▶ Try the live demo →](https://iacbi.github.io/memory-palace/)**

[![Deploy demo to GitHub Pages](https://github.com/IACBI/memory-palace/actions/workflows/deploy.yml/badge.svg)](https://github.com/IACBI/memory-palace/actions/workflows/deploy.yml)
![Next.js](https://img.shields.io/badge/Next.js-16-000000?logo=nextdotjs&logoColor=white)
![React](https://img.shields.io/badge/React-19-149ECA?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-06B6D4?logo=tailwindcss&logoColor=white)
![License: MIT](https://img.shields.io/badge/License-MIT-c9a227)

</div>

---

## Why Memory Palace?

Most note apps are lists. Memory Palace is a **place**. Ideas live in rooms you arrange
yourself, objects sit where you put them on a canvas, and relationships between them form a
graph you can wander. It borrows the calm, deliberate feel of an old library and the speed
of a modern knowledge tool.

It's **local-first**: everything is saved in your browser, instantly and privately. The data
layer sits behind a storage-adapter interface, so a real database can be dropped in later
without touching the UI.

> **About the live demo:** the hosted version stores your palace in *your* browser only —
> nothing is uploaded. It opens with a sample palace so there's something to explore right
> away; reset or clear it any time from **Settings**.

---

## Feature tour

- **Dashboard** (`/`) — a time-aware greeting, palace stats, recent rooms and objects, an
  activity feed, and an inline quick-add.
- **Palace** (`/palace`) — the mansion floor plan. Rooms are laid out on a grid; click a
  chamber to enter, or add / edit / delete rooms in place.
- **Room** (`/room?r=…`) — a spatial canvas. Drag objects to place them (mouse or touch),
  nudge a focused object with the arrow keys, and open any object to edit it.
- **Object editor** — a slide-over panel that opens from anywhere. Edit title, type, content,
  URL / file name, tags, and room; pin objects; and manage relationships to other objects.
  Changes save live.
- **Library** (`/library`) — every object in one place, with search, room / type / tag
  filters, sorting, and list or grid layouts.
- **Graph** (`/graph`) — a force-directed view of objects and their connections, coloured by
  room. Drag nodes, hover to highlight neighbours, click to open.
- **Settings** (`/settings`) — appearance preferences, JSON export / import (validated),
  reset to the sample palace, clear everything, storage stats, and a shortcuts reference.
- **Command palette** — `Ctrl / ⌘ + K` anywhere to search rooms and objects or jump to a view.

---

## Make it yours

A single, discoverable **Appearance** panel in Settings — every option persists to your
browser and has a sensible default, so the app looks great untouched:

| Preference | Options | Default |
| --- | --- | --- |
| **Accent** | Brass · Copper · Sage · Slate | Brass |
| **Text size** | Small · Medium · Large | Medium |
| **Reduce motion** | On / off (also respects your OS setting) | Off |

Every accent stays muted and atmospheric, and each is contrast-checked to carry dark button
text at WCAG AA.

---

## Keyboard shortcuts

| Keys | Action |
| --- | --- |
| `Ctrl / ⌘ + K` | Open the command palette / search |
| `Esc` | Close a dialog, panel, or the palette |
| `Enter` | Open the focused object |
| `← → ↑ ↓` | Move a focused object (hold `Shift` for larger steps) |
| `Delete` | Delete a focused object |

---

## Getting started

Requires **Node.js 18.18+** (developed on Node 20+).

```bash
npm install
npm run dev      # http://localhost:3000
```

On first run the app seeds a sample palace (6 rooms, ~20 objects, connections) so there's
something to explore immediately.

Other scripts:

```bash
npm run build    # production build
npm start        # serve the production build
npm run lint     # eslint
```

---

## Deploying the static demo

The app is a client-only SPA, so it exports to fully static files and hosts anywhere —
GitHub Pages, Netlify, an S3 bucket, or a folder.

The included workflow ([`.github/workflows/deploy.yml`](.github/workflows/deploy.yml)) builds
and publishes to GitHub Pages on every push to `main`. The Pages build is opted in with an
environment flag so local development stays unaffected:

```bash
GITHUB_PAGES=true npm run build   # emits a static site to ./out
```

`GITHUB_PAGES=true` turns on `output: "export"`, sets the `/memory-palace` base path, and
enables trailing-slash routing for static hosts. A normal `npm run build` keeps Next.js's
default, server-capable output.

---

## Data model

A single `PalaceData` document holds everything and is what export / import moves around:

```ts
PalaceData {
  version: 1
  rooms:       Room[]
  objects:     KnowledgeObject[]
  connections: Connection[]
  activity:    ActivityEvent[]   // recent events, capped at 50
  settings:    PalaceSettings
}

Room            { id, name, description, icon, palette, position {x,y,w,h}, createdAt, updatedAt }
KnowledgeObject { id, roomId, type: 'note'|'link'|'idea'|'file', title, content,
                  url?, fileName?, tags[], position {x,y} /* percent within room */,
                  pinned?, createdAt, updatedAt }
Connection      { id, fromId, toId, label? }
ActivityEvent   { id, kind, targetType, targetId, targetTitle, at }
PalaceSettings  { accent, textSize, reduceMotion, lastView }
```

Timestamps are ISO strings; IDs are UUIDs.

### Export / import format

**Settings → Export JSON** downloads `memory-palace-export-YYYY-MM-DD.json`, a pretty-printed
`PalaceData` document. **Import JSON** reads such a file, structurally validates it, shows a
summary to confirm, then replaces the current palace. Invalid or non-Palace files are rejected
with a message and leave your data untouched. Older exports (before accent / text-size
preferences existed) still import cleanly — missing preferences fall back to their defaults.

---

## Architecture

- **Next.js (App Router) + TypeScript + Tailwind CSS v4.** Client-rendered screens under a
  shared `AppShell`. Theming is driven entirely by CSS custom properties, so accent and
  text-size preferences are a single data-attribute swap on `<html>`.
- **State:** a single Zustand store (`lib/store.ts`) owns all data and UI state. Every mutation
  stamps timestamps, logs activity, and persists through a debounced save.
- **Persistence:** `lib/storage/adapter.ts` defines a `StorageAdapter` interface;
  `LocalStorageAdapter` implements it today. `validatePalaceData` guards everything read from
  storage or import. Swap the adapter to move to a backend.
- **Structure:** `lib/` holds types, seed data, search, palette / icon helpers, settings
  defaults, and the store; `components/` is organised by feature.

```
app/            routes: dashboard, palace, room, library, graph, settings
components/     ui primitives + feature components + shell + providers
lib/            types, store, storage adapters, search, seed data, settings, helpers
```

---

## Tech stack

Next.js 16 · React 19 · TypeScript (strict) · Tailwind CSS v4 · Zustand · d3-force ·
lucide-react · Cormorant Garamond + Inter.

---

## License

[MIT](LICENSE) © A.C.B
