"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import {
  Search,
  CornerDownLeft,
  Plus,
  DoorOpen,
  LayoutDashboard,
  Castle,
  Library,
  Share2,
  Settings,
  type LucideIcon,
} from "lucide-react";
import { usePalaceStore } from "@/lib/store";
import { searchPalace } from "@/lib/search";
import { OBJECT_TYPE_META } from "@/lib/object-meta";
import { paletteColor } from "@/lib/palette";
import { RoomIcon } from "@/components/RoomIcon";
import { Kbd } from "@/components/ui/Kbd";

interface FlatItem {
  key: string;
  group: string;
  render: React.ReactNode;
  run: () => void;
}

export function CommandPalette() {
  const open = usePalaceStore((s) => s.commandPaletteOpen);
  const setOpen = usePalaceStore((s) => s.setCommandPaletteOpen);

  // Global Ctrl/Cmd+K toggles the palette.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen(!usePalaceStore.getState().commandPaletteOpen);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setOpen]);

  if (!open || typeof document === "undefined") return null;
  return <CommandPaletteInner onClose={() => setOpen(false)} />;
}

/**
 * The palette body. Mounted only while open, so its query/selection state is
 * always fresh — no reset effect needed.
 */
function CommandPaletteInner({ onClose }: { onClose: () => void }) {
  const rooms = usePalaceStore((s) => s.rooms);
  const objects = usePalaceStore((s) => s.objects);
  const openObject = usePalaceStore((s) => s.openObject);
  const createObject = usePalaceStore((s) => s.createObject);
  const requestNewRoom = usePalaceStore((s) => s.requestNewRoom);
  const router = useRouter();

  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Focus the input on mount (DOM sync only — no state updates).
  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 40);
    return () => clearTimeout(t);
  }, []);

  const close = onClose;

  const goToObject = (id: string, roomId: string) => {
    close();
    router.push(`/room?r=${roomId}`);
    openObject(id);
  };
  const goToRoom = (id: string) => {
    close();
    router.push(`/room?r=${id}`);
  };
  const navigate = (href: string) => {
    close();
    router.push(href);
  };

  const results = useMemo(
    () => searchPalace(query, rooms, objects),
    [query, rooms, objects],
  );

  const recentObjects = useMemo(
    () =>
      [...objects]
        .sort(
          (a, b) =>
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
        )
        .slice(0, 5),
    [objects],
  );

  const roomById = useMemo(
    () => new Map(rooms.map((r) => [r.id, r])),
    [rooms],
  );

  const items = useMemo<FlatItem[]>(() => {
    const q = query.trim().toLowerCase();
    const list: FlatItem[] = [];

    const objectRow = (
      obj: { id: string; roomId: string; type: keyof typeof OBJECT_TYPE_META; title: string },
      roomName: string | null,
    ) => {
      const Glyph = OBJECT_TYPE_META[obj.type].icon;
      const room = roomById.get(obj.roomId);
      const color = room ? paletteColor(room.palette) : "var(--palace-muted)";
      return (
        <div className="flex items-center gap-3">
          <span
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md"
            style={{ backgroundColor: `${color}22`, color }}
          >
            <Glyph size={14} strokeWidth={1.75} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm text-text">{obj.title}</span>
            <span className="block truncate text-[11px] text-muted">
              {roomName ?? "Unassigned"}
            </span>
          </span>
        </div>
      );
    };

    // Object results (or recents when empty)
    if (q) {
      for (const r of results.rooms) {
        const color = paletteColor(r.room.palette);
        list.push({
          key: `room-${r.room.id}`,
          group: "Rooms",
          run: () => goToRoom(r.room.id),
          render: (
            <div className="flex items-center gap-3">
              <span
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md"
                style={{ backgroundColor: `${color}22`, color }}
              >
                <RoomIcon name={r.room.icon} size={14} strokeWidth={1.75} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm text-text">
                  {r.room.name}
                </span>
                <span className="block truncate text-[11px] text-muted">
                  {r.room.description}
                </span>
              </span>
            </div>
          ),
        });
      }
      for (const r of results.objects) {
        list.push({
          key: `object-${r.object.id}`,
          group: "Objects",
          run: () => goToObject(r.object.id, r.object.roomId),
          render: objectRow(r.object, r.roomName),
        });
      }
    } else {
      for (const obj of recentObjects) {
        list.push({
          key: `recent-${obj.id}`,
          group: "Recent",
          run: () => goToObject(obj.id, obj.roomId),
          render: objectRow(obj, roomById.get(obj.roomId)?.name ?? null),
        });
      }
    }

    // Quick actions (always available, matched by simple keyword)
    const actions: Array<{ id: string; label: string; icon: LucideIcon; run: () => void }> = [
      {
        id: "new-object",
        label: "New object…",
        icon: Plus,
        run: () => {
          const room = rooms[0];
          if (!room) return;
          const created = createObject({
            roomId: room.id,
            type: "note",
            title: "New object",
            position: { x: 45, y: 45 },
          });
          close();
          router.push(`/room?r=${room.id}`);
          openObject(created.id);
        },
      },
      {
        id: "new-room",
        label: "New room…",
        icon: DoorOpen,
        run: () => {
          requestNewRoom();
          navigate("/palace");
        },
      },
      { id: "go-dashboard", label: "Go to Dashboard", icon: LayoutDashboard, run: () => navigate("/") },
      { id: "go-palace", label: "Go to Palace", icon: Castle, run: () => navigate("/palace") },
      { id: "go-library", label: "Go to Library", icon: Library, run: () => navigate("/library") },
      { id: "go-graph", label: "Go to Graph", icon: Share2, run: () => navigate("/graph") },
      { id: "go-settings", label: "Go to Settings", icon: Settings, run: () => navigate("/settings") },
    ];

    for (const a of actions) {
      if (q && !a.label.toLowerCase().includes(q)) continue;
      const Icon = a.icon;
      list.push({
        key: `action-${a.id}`,
        group: "Actions",
        run: a.run,
        render: (
          <div className="flex items-center gap-3">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-surface-2 text-muted">
              <Icon size={14} strokeWidth={1.75} />
            </span>
            <span className="text-sm text-text">{a.label}</span>
          </div>
        ),
      });
    }

    return list;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, results, recentObjects, roomById, rooms]);

  // Keep the active index in range as the list changes.
  const clampedActive = items.length === 0 ? 0 : Math.min(active, items.length - 1);

  useEffect(() => {
    const el = listRef.current?.querySelector<HTMLElement>(
      `[data-index="${clampedActive}"]`,
    );
    el?.scrollIntoView({ block: "nearest" });
  }, [clampedActive]);

  // Group items for rendering while preserving flat indices.
  let runningIndex = -1;
  const groups: Array<{ name: string; entries: Array<{ item: FlatItem; index: number }> }> = [];
  for (const item of items) {
    runningIndex += 1;
    const idx = runningIndex;
    const last = groups[groups.length - 1];
    if (last && last.name === item.group) {
      last.entries.push({ item, index: idx });
    } else {
      groups.push({ name: item.group, entries: [{ item, index: idx }] });
    }
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      e.preventDefault();
      close();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => (items.length ? (i + 1) % items.length : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => (items.length ? (i - 1 + items.length) % items.length : 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      items[clampedActive]?.run();
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[70] flex items-start justify-center p-4 pt-[12vh]">
      <div
        className="animate-[fadeIn_150ms_ease-out] absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={close}
        aria-hidden
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
        onKeyDown={onKeyDown}
        className="animate-[dialogIn_180ms_ease-out] relative z-10 flex max-h-[70vh] w-full max-w-xl flex-col overflow-hidden rounded-2xl border border-border-strong bg-surface shadow-[0_32px_100px_-16px_rgba(0,0,0,0.8)]"
      >
        <div className="flex items-center gap-3 border-b border-border-hair px-4">
          <Search size={18} strokeWidth={1.75} className="shrink-0 text-muted" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActive(0);
            }}
            placeholder="Search the palace…"
            className="w-full bg-transparent py-4 text-sm text-text placeholder:text-muted focus:outline-none"
            aria-label="Search"
          />
          <Kbd>Esc</Kbd>
        </div>

        <div ref={listRef} className="min-h-0 flex-1 overflow-y-auto py-2">
          {items.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-muted">
              No matches for “{query}”.
            </p>
          ) : (
            groups.map((group) => (
              <div key={group.name} className="mb-1">
                <div className="px-4 py-1.5 text-[10px] tracking-widest text-muted uppercase">
                  {group.name}
                </div>
                {group.entries.map(({ item, index }) => (
                  <button
                    key={item.key}
                    type="button"
                    data-index={index}
                    onMouseMove={() => setActive(index)}
                    onClick={() => item.run()}
                    className={`flex w-full items-center justify-between gap-3 px-4 py-2 text-left transition-colors ${
                      index === clampedActive ? "bg-surface-2" : "hover:bg-surface-2/50"
                    }`}
                  >
                    <span className="min-w-0 flex-1">{item.render}</span>
                    {index === clampedActive ? (
                      <CornerDownLeft
                        size={14}
                        strokeWidth={1.75}
                        className="shrink-0 text-muted"
                      />
                    ) : null}
                  </button>
                ))}
              </div>
            ))
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
