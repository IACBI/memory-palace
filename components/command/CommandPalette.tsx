"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { useRoomMap } from "@/lib/hooks/use-room-map";
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
import { searchPalace, type MatchRange } from "@/lib/search";
import { byUpdatedDesc } from "@/lib/sort";
import type { KnowledgeObject, PaletteKey, Room } from "@/lib/types";
import { paletteColor, paletteTint } from "@/lib/palette";
import { RoomIcon } from "@/components/RoomIcon";
import { Highlight } from "@/components/ui/Highlight";
import { ObjectRow } from "@/components/objects/ObjectRow";
import { Kbd } from "@/components/ui/Kbd";
import { useFocusTrap } from "@/lib/hooks/use-focus-trap";
import { useDismissable } from "@/lib/hooks/use-dismissable";

/** A navigation or creation command, independent of how it is drawn. */
interface QuickAction {
  id: string;
  label: string;
  icon: LucideIcon;
  /** Where it goes, for the plain navigation actions. */
  href: string;
}

const ACTIONS: QuickAction[] = [
  { id: "new-object", label: "New object…", icon: Plus, href: "" },
  { id: "new-room", label: "New room…", icon: DoorOpen, href: "/palace" },
  {
    id: "go-dashboard",
    label: "Go to Dashboard",
    icon: LayoutDashboard,
    href: "/",
  },
  { id: "go-palace", label: "Go to Palace", icon: Castle, href: "/palace" },
  { id: "go-library", label: "Go to Library", icon: Library, href: "/library" },
  { id: "go-graph", label: "Go to Graph", icon: Share2, href: "/graph" },
  {
    id: "go-settings",
    label: "Go to Settings",
    icon: Settings,
    href: "/settings",
  },
];

/**
 * A row in the palette, described rather than rendered.
 *
 * Keeping these as data is what lets the list be memoised on the palace alone
 * — see the note on `items` below.
 */
type CommandItem = { key: string; group: string } & (
  | { kind: "room"; room: Room; matches: readonly MatchRange[] }
  | {
      kind: "object";
      object: KnowledgeObject;
      palette: PaletteKey | null;
      roomName: string | null;
      matches: readonly MatchRange[];
    }
  | { kind: "create"; title: string; room: Room }
  | { kind: "action"; action: QuickAction }
);

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
  const listId = useId();

  const close = onClose;

  // Mounted only while open, so the overlay is always active here.
  const panelRef = useFocusTrap<HTMLDivElement>(true, {
    initialFocus: inputRef,
  });
  useDismissable(true, close);

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
    () => [...objects].sort(byUpdatedDesc).slice(0, 5),
    [objects],
  );

  const roomById = useRoomMap(rooms);

  /**
   * What the palette can offer, as data.
   *
   * This used to build React elements *and* capture a click handler for each
   * row, which meant the memo depended on half the component and carried an
   * `exhaustive-deps` suppression to hide it. Describing each item instead
   * leaves the memo depending only on the query and the palace, and moves
   * doing the thing to `runItem`, below, where the router and the store
   * actually live.
   */
  const items = useMemo<CommandItem[]>(() => {
    const q = query.trim().toLowerCase();
    const list: CommandItem[] = [];

    const objectItem = (
      group: string,
      object: KnowledgeObject,
      roomName: string | null,
      matches: readonly MatchRange[] = [],
    ): CommandItem => ({
      kind: "object",
      key: `${group}-${object.id}`,
      group,
      object,
      palette: roomById.get(object.roomId)?.palette ?? null,
      roomName,
      matches,
    });

    if (q) {
      for (const hit of results.rooms) {
        list.push({
          kind: "room",
          key: `room-${hit.room.id}`,
          group: "Rooms",
          room: hit.room,
          matches: hit.matches,
        });
      }
      for (const hit of results.objects) {
        list.push(objectItem("Objects", hit.object, hit.roomName, hit.matches));
      }

      // A search that finds nothing is the moment the reader most wants to
      // write something down, so the dead end becomes the offer to create it.
      const target = rooms[0];
      if (results.objects.length === 0 && target) {
        list.push({
          kind: "create",
          key: "create-object",
          group: "Create",
          title: query.trim(),
          room: target,
        });
      }
    } else {
      for (const object of recentObjects) {
        list.push(
          objectItem(
            "Recent",
            object,
            roomById.get(object.roomId)?.name ?? null,
          ),
        );
      }
    }

    for (const action of ACTIONS) {
      // With no rooms there is nowhere to put an object, and the row used to
      // be a button that silently did nothing.
      if (action.id === "new-object" && !rooms[0]) continue;
      if (q && !action.label.toLowerCase().includes(q)) continue;
      list.push({
        kind: "action",
        key: `action-${action.id}`,
        group: "Actions",
        action,
      });
    }

    return list;
  }, [query, results, recentObjects, roomById, rooms]);

  /** Performs an item. The only place the router and the store are touched. */
  const runItem = (item: CommandItem) => {
    switch (item.kind) {
      case "room":
        goToRoom(item.room.id);
        return;
      case "object":
        goToObject(item.object.id, item.object.roomId);
        return;
      case "create": {
        const created = createObject({
          roomId: item.room.id,
          type: "note",
          title: item.title,
          position: { x: 45, y: 45 },
        });
        close();
        router.push(`/room?r=${item.room.id}`);
        openObject(created.id);
        return;
      }
      case "action":
        switch (item.action.id) {
          case "new-object": {
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
            return;
          }
          case "new-room":
            requestNewRoom();
            navigate("/palace");
            return;
          default:
            navigate(item.action.href);
        }
    }
  };

  /** Draws an item. Pure — no store, no router, no closures over them. */
  const renderItem = (item: CommandItem) => {
    switch (item.kind) {
      case "room":
        return (
          <span className="flex w-full items-center gap-3">
            <span
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md"
              style={{
                backgroundColor: paletteTint(item.room.palette, "chip"),
                color: paletteColor(item.room.palette),
              }}
            >
              <RoomIcon name={item.room.icon} size={14} strokeWidth={1.75} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm text-text">
                <Highlight text={item.room.name} ranges={item.matches} />
              </span>
              <span className="block truncate text-[11px] text-muted">
                {item.room.description}
              </span>
            </span>
          </span>
        );
      case "object":
        return (
          <ObjectRow
            object={item.object}
            palette={item.palette}
            roomName={item.roomName}
            matches={item.matches}
          />
        );
      case "create":
        return (
          <span className="flex w-full items-center gap-3">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-surface-2 text-accent">
              <Plus size={14} strokeWidth={1.75} aria-hidden />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm text-text">
                Create “{item.title}”
              </span>
              <span className="block truncate text-[11px] text-muted">
                A new note in {item.room.name}
              </span>
            </span>
          </span>
        );
      case "action": {
        const Icon = item.action.icon;
        return (
          <span className="flex w-full items-center gap-3">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-surface-2 text-muted">
              <Icon size={14} strokeWidth={1.75} aria-hidden />
            </span>
            <span className="text-sm text-text">{item.action.label}</span>
          </span>
        );
      }
    }
  };

  // Keep the active index in range as the list changes.
  const clampedActive =
    items.length === 0 ? 0 : Math.min(active, items.length - 1);

  useEffect(() => {
    const el = listRef.current?.querySelector<HTMLElement>(
      `[data-index="${clampedActive}"]`,
    );
    el?.scrollIntoView({ block: "nearest" });
  }, [clampedActive]);

  // Group items for rendering while preserving flat indices.
  let runningIndex = -1;
  const groups: Array<{
    name: string;
    entries: Array<{ item: CommandItem; index: number }>;
  }> = [];
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
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => (items.length ? (i + 1) % items.length : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) =>
        items.length ? (i - 1 + items.length) % items.length : 0,
      );
    } else if (e.key === "Enter") {
      e.preventDefault();
      const item = items[clampedActive];
      if (item) runItem(item);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[70] flex items-start justify-center p-4 pt-[12vh]">
      <div
        className="motion-fade-in absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={close}
        aria-hidden
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
        className="motion-dialog-in relative z-10 flex max-h-[70vh] w-full max-w-xl flex-col overflow-hidden rounded-2xl border border-border-strong bg-surface shadow-[0_32px_100px_-16px_rgba(0,0,0,0.8)]"
      >
        <div className="flex items-center gap-3 border-b border-border-hair px-4">
          <Search
            size={18}
            strokeWidth={1.75}
            className="shrink-0 text-muted"
          />
          {/*
            ARIA 1.2 combobox. Focus stays in the input while `aria-
            activedescendant` points at the highlighted row, so a screen-reader
            user hears which result Enter will run. Previously the active row
            was signalled by background colour alone.
          */}
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActive(0);
            }}
            onKeyDown={onKeyDown}
            placeholder="Search the palace…"
            className="w-full bg-transparent py-4 text-sm text-text placeholder:text-muted focus:outline-none"
            aria-label="Search"
            role="combobox"
            aria-expanded={items.length > 0}
            aria-controls={listId}
            aria-activedescendant={
              items.length > 0 ? `${listId}-option-${clampedActive}` : undefined
            }
            aria-autocomplete="list"
            autoComplete="off"
          />
          <Kbd>Esc</Kbd>
        </div>

        <div
          ref={listRef}
          id={listId}
          role="listbox"
          aria-label="Results"
          className="min-h-0 flex-1 overflow-y-auto py-2"
        >
          {items.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-muted">
              No matches for “{query}”.
            </p>
          ) : (
            groups.map((group) => (
              <div
                key={group.name}
                role="group"
                aria-label={group.name}
                className="mb-1"
              >
                <div
                  aria-hidden
                  className="px-4 py-1.5 text-[11px] tracking-widest text-muted uppercase"
                >
                  {group.name}
                </div>
                {group.entries.map(({ item, index }) => (
                  // A button so pointer activation stays native, but
                  // `tabIndex={-1}` keeps it out of the tab order: the input is
                  // the single tab stop and drives selection through
                  // `aria-activedescendant`.
                  <button
                    key={item.key}
                    type="button"
                    id={`${listId}-option-${index}`}
                    role="option"
                    tabIndex={-1}
                    aria-selected={index === clampedActive}
                    data-index={index}
                    onMouseMove={() => setActive(index)}
                    onClick={() => runItem(item)}
                    className={`flex w-full items-center justify-between gap-3 px-4 py-2 text-left transition-colors ${
                      index === clampedActive
                        ? "bg-surface-2"
                        : "hover:bg-surface-2/50"
                    }`}
                  >
                    <span className="min-w-0 flex-1">{renderItem(item)}</span>
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

        {/* Announces the result count without moving focus. */}
        <span aria-live="polite" className="sr-only">
          {query
            ? `${items.length} ${items.length === 1 ? "result" : "results"}`
            : ""}
        </span>
      </div>
    </div>,
    document.body,
  );
}
