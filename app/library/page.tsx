"use client";

import { useMemo, useState } from "react";
import { Search, LayoutGrid, Rows3, Pin, X } from "lucide-react";
import { usePalaceStore } from "@/lib/store";
import { PageHeader } from "@/components/shell/PageHeader";
import { Select } from "@/components/ui/Select";
import { EmptyState } from "@/components/ui/EmptyState";
import { paletteColor } from "@/lib/palette";
import { OBJECT_TYPE_META, OBJECT_TYPES } from "@/lib/object-meta";
import { searchPalace } from "@/lib/search";
import { relativeTime } from "@/lib/activity-text";
import type { KnowledgeObject, ObjectType } from "@/lib/types";

type SortKey = "updated" | "created" | "title" | "room";
type Layout = "list" | "grid";

const SORTS: { value: SortKey; label: string }[] = [
  { value: "updated", label: "Last updated" },
  { value: "created", label: "Recently created" },
  { value: "title", label: "Title A–Z" },
  { value: "room", label: "Room" },
];

export default function LibraryPage() {
  const objects = usePalaceStore((s) => s.objects);
  const rooms = usePalaceStore((s) => s.rooms);
  const openObject = usePalaceStore((s) => s.openObject);

  const [query, setQuery] = useState("");
  const [roomFilter, setRoomFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState<"all" | ObjectType>("all");
  const [tagFilter, setTagFilter] = useState("all");
  const [sort, setSort] = useState<SortKey>("updated");
  const [layout, setLayout] = useState<Layout>("list");

  const roomById = useMemo(() => new Map(rooms.map((r) => [r.id, r])), [rooms]);
  const allTags = useMemo(
    () => Array.from(new Set(objects.flatMap((o) => o.tags))).sort(),
    [objects],
  );

  const filtersActive =
    query.trim() !== "" ||
    roomFilter !== "all" ||
    typeFilter !== "all" ||
    tagFilter !== "all";

  const filtered = useMemo(() => {
    let list = objects;

    if (query.trim()) {
      const ids = new Set(
        searchPalace(query, rooms, objects).objects.map((r) => r.object.id),
      );
      list = list.filter((o) => ids.has(o.id));
    }
    if (roomFilter !== "all") list = list.filter((o) => o.roomId === roomFilter);
    if (typeFilter !== "all") list = list.filter((o) => o.type === typeFilter);
    if (tagFilter !== "all") list = list.filter((o) => o.tags.includes(tagFilter));

    const compare = (a: KnowledgeObject, b: KnowledgeObject): number => {
      if (Boolean(a.pinned) !== Boolean(b.pinned)) return a.pinned ? -1 : 1;
      switch (sort) {
        case "title":
          return a.title.localeCompare(b.title);
        case "created":
          return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        case "room": {
          const ra = roomById.get(a.roomId)?.name ?? "";
          const rb = roomById.get(b.roomId)?.name ?? "";
          return ra.localeCompare(rb) || a.title.localeCompare(b.title);
        }
        case "updated":
        default:
          return (
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
          );
      }
    };

    return [...list].sort(compare);
  }, [objects, rooms, query, roomFilter, typeFilter, tagFilter, sort, roomById]);

  const clearFilters = () => {
    setQuery("");
    setRoomFilter("all");
    setTypeFilter("all");
    setTagFilter("all");
  };

  return (
    <div className="mx-auto max-w-6xl px-5 py-10 sm:px-8">
      <PageHeader
        title="Library"
        subtitle="Every object across every room. Search, filter, and sort."
      />

      {/* Toolbar */}
      <div className="mt-6 space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex min-w-[220px] flex-1 items-center gap-2 rounded-lg border border-border-hair bg-surface px-3 focus-within:border-accent-dim">
            <Search size={16} strokeWidth={1.75} className="shrink-0 text-muted" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search objects…"
              aria-label="Search objects"
              className="w-full bg-transparent py-2 text-sm text-text placeholder:text-muted focus:outline-none"
            />
          </div>

          <div className="w-44">
            <Select
              value={roomFilter}
              onChange={(e) => setRoomFilter(e.target.value)}
              aria-label="Filter by room"
            >
              <option value="all">All rooms</option>
              {rooms.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </Select>
          </div>

          <div className="w-40">
            <Select
              value={tagFilter}
              onChange={(e) => setTagFilter(e.target.value)}
              aria-label="Filter by tag"
            >
              <option value="all">All tags</option>
              {allTags.map((tag) => (
                <option key={tag} value={tag}>
                  #{tag}
                </option>
              ))}
            </Select>
          </div>

          <div className="w-44">
            <Select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              aria-label="Sort by"
            >
              {SORTS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </Select>
          </div>

          <div className="flex items-center gap-1 rounded-lg border border-border-hair bg-surface p-1">
            <button
              type="button"
              onClick={() => setLayout("list")}
              aria-label="List view"
              aria-pressed={layout === "list"}
              className={`flex h-7 w-7 items-center justify-center rounded-md transition-colors ${
                layout === "list" ? "bg-surface-2 text-text" : "text-muted hover:text-text"
              }`}
            >
              <Rows3 size={15} strokeWidth={1.75} />
            </button>
            <button
              type="button"
              onClick={() => setLayout("grid")}
              aria-label="Grid view"
              aria-pressed={layout === "grid"}
              className={`flex h-7 w-7 items-center justify-center rounded-md transition-colors ${
                layout === "grid" ? "bg-surface-2 text-text" : "text-muted hover:text-text"
              }`}
            >
              <LayoutGrid size={15} strokeWidth={1.75} />
            </button>
          </div>
        </div>

        {/* Type segmented */}
        <div className="flex flex-wrap items-center gap-1.5">
          {(["all", ...OBJECT_TYPES] as const).map((t) => {
            const active = typeFilter === t;
            const label = t === "all" ? "All" : OBJECT_TYPE_META[t].label;
            return (
              <button
                key={t}
                type="button"
                onClick={() => setTypeFilter(t)}
                aria-pressed={active}
                className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                  active
                    ? "border-accent-dim bg-surface-2 text-text"
                    : "border-border-hair text-muted hover:border-border-strong hover:text-text"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>

        {/* Counts line */}
        <div className="flex items-center justify-between text-xs text-muted">
          <span>
            {filtered.length} {filtered.length === 1 ? "object" : "objects"}
            {filtersActive ? ` · filtered from ${objects.length}` : ""}
          </span>
          {filtersActive ? (
            <button
              type="button"
              onClick={clearFilters}
              className="inline-flex items-center gap-1 text-muted transition-colors hover:text-text"
            >
              <X size={13} strokeWidth={1.75} /> Clear filters
            </button>
          ) : null}
        </div>
      </div>

      {/* Results */}
      {filtered.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            icon={Search}
            title="Nothing matches"
            hint="Try a different search or clear your filters."
          />
        </div>
      ) : layout === "list" ? (
        <div className="mt-4 overflow-hidden rounded-xl border border-border-hair">
          {filtered.map((object) => {
            const room = roomById.get(object.roomId);
            const color = room ? paletteColor(room.palette) : "var(--palace-muted)";
            const Glyph = OBJECT_TYPE_META[object.type].icon;
            return (
              <button
                key={object.id}
                type="button"
                onClick={() => openObject(object.id)}
                className="flex w-full items-center gap-3 border-b border-border-hair bg-surface px-4 py-3 text-left transition-colors last:border-0 hover:bg-surface-2"
              >
                <span
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md"
                  style={{ backgroundColor: `${color}22`, color }}
                >
                  <Glyph size={15} strokeWidth={1.75} />
                </span>
                <span className="flex min-w-0 flex-1 items-center gap-2">
                  <span className="truncate text-sm text-text">{object.title}</span>
                  {object.pinned ? (
                    <Pin size={12} strokeWidth={1.75} className="shrink-0 text-accent" />
                  ) : null}
                </span>
                <span className="hidden max-w-[30%] shrink-0 items-center gap-1.5 sm:flex">
                  {object.tags.slice(0, 3).map((tag) => (
                    <span
                      key={tag}
                      className="truncate rounded-full border border-border-hair bg-surface-2 px-2 py-0.5 text-[10px] text-muted"
                    >
                      {tag}
                    </span>
                  ))}
                </span>
                <span
                  className="hidden shrink-0 items-center gap-1.5 text-xs text-muted md:flex"
                  style={{ minWidth: 120 }}
                >
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: color }}
                    aria-hidden
                  />
                  {room?.name ?? "—"}
                </span>
                <time className="shrink-0 text-xs text-muted" style={{ minWidth: 64 }}>
                  {relativeTime(object.updatedAt)}
                </time>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((object) => {
            const room = roomById.get(object.roomId);
            const color = room ? paletteColor(room.palette) : "var(--palace-muted)";
            const Glyph = OBJECT_TYPE_META[object.type].icon;
            return (
              <button
                key={object.id}
                type="button"
                onClick={() => openObject(object.id)}
                className="flex flex-col rounded-xl border border-border-hair bg-surface p-4 text-left transition-all duration-200 hover:border-border-strong hover:bg-surface-2"
                style={{ boxShadow: `inset 3px 0 0 0 ${color}` }}
              >
                <div className="flex items-center justify-between">
                  <span
                    className="flex h-8 w-8 items-center justify-center rounded-md"
                    style={{ backgroundColor: `${color}22`, color }}
                  >
                    <Glyph size={15} strokeWidth={1.75} />
                  </span>
                  {object.pinned ? (
                    <Pin size={13} strokeWidth={1.75} className="text-accent" />
                  ) : null}
                </div>
                <h3 className="mt-2 line-clamp-2 font-display text-base leading-tight text-text">
                  {object.title}
                </h3>
                <p className="mt-1 line-clamp-2 text-xs text-muted">
                  {object.content}
                </p>
                <div className="mt-3 flex items-center justify-between text-[11px] text-muted">
                  <span className="inline-flex items-center gap-1.5">
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: color }}
                      aria-hidden
                    />
                    {room?.name ?? "—"}
                  </span>
                  <time>{relativeTime(object.updatedAt)}</time>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
