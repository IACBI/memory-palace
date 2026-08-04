"use client";

import { useMemo, useState } from "react";
import { useRoomMap } from "@/lib/hooks/use-room-map";
import { Search, LayoutGrid, Rows3, Pin, X } from "lucide-react";
import { usePalaceStore } from "@/lib/store";
import { useHydrated } from "@/lib/hooks/use-hydrated";
import { useIncrementalList } from "@/lib/hooks/use-incremental-list";
import { LibrarySkeleton } from "@/components/skeletons/RouteSkeletons";
import { Select } from "@/components/ui/Select";
import { EmptyState } from "@/components/ui/EmptyState";
import { Highlight } from "@/components/ui/Highlight";
import { ObjectGlyph } from "@/components/objects/ObjectGlyph";
import { paletteColor } from "@/lib/palette";
import { OBJECT_TYPE_META, OBJECT_TYPES } from "@/lib/object-meta";
import { searchPalace } from "@/lib/search";
import { relativeTime } from "@/lib/activity-text";
import { byCreatedDesc, byTitle, byUpdatedDesc, pinnedFirst } from "@/lib/sort";
import type { KnowledgeObject, ObjectType } from "@/lib/types";

type SortKey = "updated" | "created" | "title" | "room";
type Layout = "list" | "grid";

const SORTS: { value: SortKey; label: string }[] = [
  { value: "updated", label: "Last updated" },
  { value: "created", label: "Recently created" },
  { value: "title", label: "Title A–Z" },
  { value: "room", label: "Room" },
];

/** Marks where the next page of results begins loading. */
function ListSentinel({
  onVisible,
}: {
  onVisible: (node: HTMLElement | null) => void;
}) {
  return (
    <div ref={onVisible} className="p-4 text-center text-xs text-muted">
      Loading more…
    </div>
  );
}

export function LibraryBody() {
  const hydrated = useHydrated();
  const objects = usePalaceStore((s) => s.objects);
  const rooms = usePalaceStore((s) => s.rooms);
  const openObject = usePalaceStore((s) => s.openObject);

  const [query, setQuery] = useState("");
  const [roomFilter, setRoomFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState<"all" | ObjectType>("all");
  const [tagFilter, setTagFilter] = useState("all");
  const [sort, setSort] = useState<SortKey>("updated");
  const [layout, setLayout] = useState<Layout>("list");

  const roomById = useRoomMap(rooms);
  const allTags = useMemo(
    () => Array.from(new Set(objects.flatMap((o) => o.tags))).sort(),
    [objects],
  );

  const filtersActive =
    query.trim() !== "" ||
    roomFilter !== "all" ||
    typeFilter !== "all" ||
    tagFilter !== "all";

  /**
   * Search hits keyed by object id, so the list can both filter on them and
   * mark the matched words in each title.
   */
  const matchesById = useMemo(() => {
    if (!query.trim()) return null;
    return new Map(
      searchPalace(query, rooms, objects).objects.map((r) => [
        r.object.id,
        r.matches,
      ]),
    );
  }, [query, rooms, objects]);

  const filtered = useMemo(() => {
    let list = objects;

    if (matchesById) list = list.filter((o) => matchesById.has(o.id));
    if (roomFilter !== "all")
      list = list.filter((o) => o.roomId === roomFilter);
    if (typeFilter !== "all") list = list.filter((o) => o.type === typeFilter);
    if (tagFilter !== "all")
      list = list.filter((o) => o.tags.includes(tagFilter));

    const byRoom = (a: KnowledgeObject, b: KnowledgeObject) => {
      const roomA = roomById.get(a.roomId)?.name ?? "";
      const roomB = roomById.get(b.roomId)?.name ?? "";
      return roomA.localeCompare(roomB) || byTitle(a, b);
    };

    const order = {
      title: byTitle,
      created: byCreatedDesc,
      room: byRoom,
      updated: byUpdatedDesc,
    }[sort];

    return [...list].sort(pinnedFirst(order));
  }, [objects, matchesById, roomFilter, typeFilter, tagFilter, sort, roomById]);

  // Long result sets render a page at a time as the reader scrolls.
  const { limit, sentinelRef, hasMore } = useIncrementalList(
    filtered.length,
    filtered,
  );
  const visible = useMemo(() => filtered.slice(0, limit), [filtered, limit]);

  const clearFilters = () => {
    setQuery("");
    setRoomFilter("all");
    setTypeFilter("all");
    setTagFilter("all");
  };

  if (!hydrated) return <LibrarySkeleton />;

  return (
    <>
      {/* Toolbar */}
      <div className="mt-6 space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex min-w-[220px] flex-1 items-center gap-2 rounded-lg border border-border-hair bg-surface px-3 focus-within:border-accent-dim">
            <Search
              size={16}
              strokeWidth={1.75}
              className="shrink-0 text-muted"
            />
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
                layout === "list"
                  ? "bg-surface-2 text-text"
                  : "text-muted hover:text-text"
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
                layout === "grid"
                  ? "bg-surface-2 text-text"
                  : "text-muted hover:text-text"
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
          {visible.map((object) => {
            const room = roomById.get(object.roomId);
            const color = paletteColor(room?.palette);
            return (
              <button
                key={object.id}
                type="button"
                onClick={() => openObject(object.id)}
                className="flex w-full items-center gap-3 border-b border-border-hair bg-surface px-4 py-3 text-left transition-colors last:border-0 hover:bg-surface-2"
              >
                <ObjectGlyph
                  type={object.type}
                  palette={room?.palette}
                  size="md"
                />
                <span className="flex min-w-0 flex-1 items-center gap-2">
                  <span className="truncate text-sm text-text">
                    <Highlight
                      text={object.title}
                      ranges={matchesById?.get(object.id) ?? []}
                    />
                  </span>
                  {object.pinned ? (
                    <Pin
                      size={12}
                      strokeWidth={1.75}
                      className="shrink-0 text-accent"
                    />
                  ) : null}
                </span>
                <span className="hidden max-w-[30%] shrink-0 items-center gap-1.5 sm:flex">
                  {object.tags.slice(0, 3).map((tag) => (
                    <span
                      key={tag}
                      className="truncate rounded-full border border-border-hair bg-surface-2 px-2 py-0.5 text-[11px] text-muted"
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
                <time
                  className="shrink-0 text-xs text-muted"
                  style={{ minWidth: 64 }}
                >
                  {relativeTime(object.updatedAt)}
                </time>
              </button>
            );
          })}
          {hasMore ? <ListSentinel onVisible={sentinelRef} /> : null}
        </div>
      ) : (
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((object) => {
            const room = roomById.get(object.roomId);
            const color = paletteColor(room?.palette);
            return (
              <button
                key={object.id}
                type="button"
                onClick={() => openObject(object.id)}
                className="flex flex-col rounded-xl border border-border-hair bg-surface p-4 text-left transition-[background-color,border-color] duration-200 hover:border-border-strong hover:bg-surface-2"
                style={{ boxShadow: `inset 3px 0 0 0 ${color}` }}
              >
                <div className="flex items-center justify-between">
                  <ObjectGlyph
                    type={object.type}
                    palette={room?.palette}
                    size="md"
                  />
                  {object.pinned ? (
                    <Pin size={13} strokeWidth={1.75} className="text-accent" />
                  ) : null}
                </div>
                <h3 className="mt-2 line-clamp-2 font-display text-base leading-tight text-text">
                  <Highlight
                    text={object.title}
                    ranges={matchesById?.get(object.id) ?? []}
                  />
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
          {hasMore ? <ListSentinel onVisible={sentinelRef} /> : null}
        </div>
      )}
    </>
  );
}
