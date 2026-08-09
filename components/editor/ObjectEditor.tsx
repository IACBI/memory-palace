"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { useRoomMap } from "@/lib/hooks/use-room-map";
import {
  X,
  ExternalLink,
  Pin,
  Trash2,
  Check,
  Link as LinkIcon,
  ShieldAlert,
} from "lucide-react";
import { usePalaceStore } from "@/lib/store";
import { useToastStore } from "@/lib/toast-store";
import type { KnowledgeObject, ObjectType } from "@/lib/types";
import { OBJECT_TYPE_META, OBJECT_TYPES } from "@/lib/object-meta";
import { paletteColor } from "@/lib/palette";
import { cn } from "@/lib/cn";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { IconButton } from "@/components/ui/IconButton";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { TagInput } from "./TagInput";
import { RelationshipPicker } from "./RelationshipPicker";
import { useDebouncedCommit } from "@/lib/hooks/use-debounced-commit";
import { useDismissable } from "@/lib/hooks/use-dismissable";
import { useFocusTrap } from "@/lib/hooks/use-focus-trap";
import { normaliseHref } from "@/lib/storage/url";

/** The free-text fields, buffered locally while the user types. */
interface TextDraft {
  title: string;
  content: string;
  url: string;
  fileName: string;
}

const FIELD_LABEL = "mb-1.5 block text-xs tracking-widest text-muted uppercase";

/**
 * Mounts the editor panel for whichever object is open.
 *
 * Keyed by object id so the panel's local draft state is recreated per object
 * instead of having to be resynchronised.
 */
export function ObjectEditor() {
  const activeObjectId = usePalaceStore((s) => s.activeObjectId);
  const exists = usePalaceStore((s) =>
    s.objects.some((o) => o.id === s.activeObjectId),
  );

  if (!activeObjectId || !exists) return null;
  return <ObjectEditorPanel key={activeObjectId} objectId={activeObjectId} />;
}

function ObjectEditorPanel({ objectId }: { objectId: string }) {
  const objects = usePalaceStore((s) => s.objects);
  const rooms = usePalaceStore((s) => s.rooms);
  const connections = usePalaceStore((s) => s.connections);
  const updateObject = usePalaceStore((s) => s.updateObject);
  const deleteObject = usePalaceStore((s) => s.deleteObject);
  const restoreObject = usePalaceStore((s) => s.restoreObject);
  const togglePin = usePalaceStore((s) => s.togglePin);
  const addConnection = usePalaceStore((s) => s.addConnection);
  const removeConnection = usePalaceStore((s) => s.removeConnection);
  const openObject = usePalaceStore((s) => s.openObject);
  const closeObject = usePalaceStore((s) => s.closeObject);
  const addToast = useToastStore((s) => s.addToast);

  const object = objects.find((o) => o.id === objectId) ?? null;

  const [saved, setSaved] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const savedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const typeLabelId = useId();
  const contentId = useId();
  const urlId = useId();
  const fileNameId = useId();
  const tagsLabelId = useId();
  const roomId = useId();

  /**
   * Free-text fields are buffered locally and written on a pause; discrete
   * ones (type, room, tags, pin) go straight through — they are not
   * high-frequency and the UI should reflect them at once.
   */
  const [draft, setDraft] = useState<TextDraft>(() => ({
    title: object?.title ?? "",
    content: object?.content ?? "",
    url: object?.url ?? "",
    fileName: object?.fileName ?? "",
  }));

  const flashSaved = useCallback(() => {
    setSaved(true);
    if (savedTimer.current) clearTimeout(savedTimer.current);
    savedTimer.current = setTimeout(() => setSaved(false), 1600);
  }, []);

  const writeText = useCallback(
    (value: TextDraft) => {
      updateObject(objectId, {
        title: value.title,
        content: value.content,
        url: value.url || undefined,
        fileName: value.fileName || undefined,
      });
      flashSaved();
    },
    [objectId, updateObject, flashSaved],
  );

  const text = useDebouncedCommit(writeText);

  // Rebuilt on every keystroke before; now only when the rooms change.
  const roomById = useRoomMap(rooms);

  const editText = useCallback(
    (patch: Partial<TextDraft>) => {
      setDraft((previous) => {
        const next = { ...previous, ...patch };
        text.push(next);
        return next;
      });
    },
    [text],
  );

  /**
   * A slide-over that claims `aria-modal` has to behave like one. It had
   * Escape and an initial focus but no trap and no focus restore, so Tab
   * walked straight out into the page behind the overlay.
   */
  const panelRef = useFocusTrap<HTMLElement>(true, { initialFocus: titleRef });

  // Clearing on unmount: without this a pending flash fires after the panel
  // has closed and calls setState on an unmounted tree.
  useEffect(
    () => () => {
      if (savedTimer.current) clearTimeout(savedTimer.current);
    },
    [],
  );

  const closePanel = useCallback(() => {
    text.flush();
    closeObject();
  }, [text, closeObject]);

  useDismissable(true, closePanel);

  if (!object) return null;

  const commit = (patch: Partial<KnowledgeObject>) => {
    updateObject(object.id, patch);
    flashSaved();
  };

  const safeHref = normaliseHref(draft.url);
  const room = rooms.find((r) => r.id === object.roomId);
  const accent = room ? paletteColor(room.palette) : "var(--palace-accent)";

  // One pass over `objects` instead of a scan per connection: this runs on
  // every keystroke, and the panel is open over the whole palace's objects.
  const objectsById = new Map(objects.map((o) => [o.id, o]));

  const objectConnections = connections
    .filter((c) => c.fromId === object.id || c.toId === object.id)
    .map((c) => {
      const otherId = c.fromId === object.id ? c.toId : c.fromId;
      return { connection: c, other: objectsById.get(otherId) };
    })
    .filter((entry) => entry.other);

  const connectedIds = new Set(
    objectConnections.map((entry) => entry.other?.id),
  );
  const candidates = objects.filter(
    (o) => o.id !== object.id && !connectedIds.has(o.id),
  );
  const allTags = Array.from(new Set(objects.flatMap((o) => o.tags))).sort();

  const handleDelete = () => {
    const snapshot = object;
    const related = connections.filter(
      (c) => c.fromId === object.id || c.toId === object.id,
    );
    deleteObject(object.id);
    closeObject();
    addToast({
      message: `Removed "${snapshot.title}"`,
      action: {
        label: "Undo",
        onClick: () => restoreObject(snapshot, related),
      },
    });
  };

  return (
    <>
      {/* Backdrop — dims on mobile, click closes everywhere */}
      <div
        className="motion-fade-in fixed inset-0 z-[var(--z-overlay)] bg-black/50 md:bg-black/20"
        onClick={closePanel}
        aria-hidden
      />

      <aside
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={`Edit ${object.title || "object"}`}
        className="motion-slide-over-in fixed top-0 right-0 z-[var(--z-toast)] flex h-full w-full flex-col border-l border-border-strong bg-surface sm:max-w-105"
        style={{
          boxShadow: `inset 4px 0 0 0 ${accent}, -24px 0 80px -24px rgba(0,0,0,0.8)`,
        }}
      >
        <div className="flex items-center justify-between gap-2 border-b border-border-hair px-4 py-3 sm:px-5">
          <div className="flex min-w-0 items-center gap-2 text-xs text-muted">
            {room ? (
              <>
                <span
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{ backgroundColor: accent }}
                  aria-hidden
                />
                <span className="truncate">{room.name}</span>
              </>
            ) : (
              <span>Object</span>
            )}
            <span
              className={cn(
                "ml-2 inline-flex shrink-0 items-center gap-1 text-accent transition-opacity duration-300",
                saved ? "opacity-100" : "opacity-0",
              )}
              aria-live="polite"
            >
              <Check size={12} strokeWidth={2.25} aria-hidden /> Saved
            </span>
          </div>
          <IconButton label="Close editor" onClick={closePanel}>
            <X size={16} strokeWidth={1.75} aria-hidden />
          </IconButton>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto px-4 py-5 sm:px-5">
          <Input
            ref={titleRef}
            value={draft.title}
            onChange={(e) => editText({ title: e.target.value })}
            onBlur={text.flush}
            placeholder="Untitled"
            className="font-display text-lg! font-medium"
            aria-label="Title"
          />

          <div>
            <span id={typeLabelId} className={FIELD_LABEL}>
              Type
            </span>
            <div
              role="group"
              aria-labelledby={typeLabelId}
              className="grid grid-cols-4 gap-1.5"
            >
              {OBJECT_TYPES.map((type) => {
                const meta = OBJECT_TYPE_META[type];
                const Glyph = meta.icon;
                const active = object.type === type;
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => commit({ type: type as ObjectType })}
                    aria-pressed={active}
                    className={cn(
                      "flex min-h-14 flex-col items-center justify-center gap-1 rounded-md border px-2 py-2 text-2xs transition-quiet",
                      active
                        ? "border-accent-dim bg-surface-2 text-text"
                        : "border-border-hair text-muted hover:border-border-strong hover:text-text",
                    )}
                  >
                    <Glyph size={16} strokeWidth={1.75} aria-hidden />
                    {meta.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label htmlFor={contentId} className={FIELD_LABEL}>
              Content
            </label>
            <Textarea
              id={contentId}
              autoGrow
              rows={4}
              value={draft.content}
              onChange={(e) => editText({ content: e.target.value })}
              onBlur={text.flush}
              placeholder="Write something…"
            />
          </div>

          {object.type === "link" ? (
            <div>
              <label htmlFor={urlId} className={FIELD_LABEL}>
                URL
              </label>
              <Input
                id={urlId}
                value={draft.url}
                onChange={(e) => editText({ url: e.target.value })}
                onBlur={text.flush}
                placeholder="https://…"
                inputMode="url"
              />
              {/*
                Checked again at render, not only when the value is stored: a
                palace can arrive from an import file, and a link is the one
                place user data becomes something the browser navigates to.
              */}
              {draft.url.trim() ? (
                safeHref ? (
                  <a
                    href={safeHref}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 flex min-h-11 items-center gap-2 rounded-md border border-border-hair bg-surface-2/60 px-3 py-2 text-xs text-muted transition-quiet hover:text-text"
                  >
                    <LinkIcon size={13} strokeWidth={1.75} aria-hidden />
                    <span className="min-w-0 flex-1 truncate">{safeHref}</span>
                    <ExternalLink size={13} strokeWidth={1.75} aria-hidden />
                  </a>
                ) : (
                  <p className="mt-2 flex items-center gap-2 rounded-md border border-danger/40 bg-surface-2/60 px-3 py-2 text-xs text-danger">
                    <ShieldAlert size={13} strokeWidth={1.75} aria-hidden />
                    <span className="min-w-0 flex-1">
                      This address uses a scheme the app won&apos;t open. Use an
                      http, https or mailto link.
                    </span>
                  </p>
                )
              ) : null}
            </div>
          ) : null}

          {object.type === "file" ? (
            <div>
              <label htmlFor={fileNameId} className={FIELD_LABEL}>
                File name
              </label>
              <Input
                id={fileNameId}
                value={draft.fileName}
                onChange={(e) => editText({ fileName: e.target.value })}
                onBlur={text.flush}
                placeholder="document.pdf"
              />
            </div>
          ) : null}

          <div>
            <span id={tagsLabelId} className={FIELD_LABEL}>
              Tags
            </span>
            <TagInput
              labelledBy={tagsLabelId}
              value={object.tags}
              onChange={(next) => commit({ tags: next })}
              suggestions={allTags}
            />
          </div>

          <div className="flex items-end gap-3">
            <div className="min-w-0 flex-1">
              <label htmlFor={roomId} className={FIELD_LABEL}>
                Room
              </label>
              <Select
                id={roomId}
                value={object.roomId}
                onChange={(e) => commit({ roomId: e.target.value })}
              >
                {rooms.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </Select>
            </div>
            <button
              type="button"
              onClick={() => togglePin(object.id)}
              aria-pressed={Boolean(object.pinned)}
              className={cn(
                "flex h-11 shrink-0 items-center gap-2 rounded-md border px-3 text-sm transition-quiet",
                object.pinned
                  ? "border-accent-dim bg-surface-2 text-accent"
                  : "border-border-hair text-muted hover:border-border-strong hover:text-text",
              )}
            >
              <Pin size={15} strokeWidth={1.75} aria-hidden />
              {object.pinned ? "Pinned" : "Pin"}
            </button>
          </div>

          <div className="border-t border-border-hair pt-5">
            <h3 className="mb-2 font-display text-base font-semibold text-text">
              Connections
            </h3>
            {objectConnections.length > 0 ? (
              <ul className="mb-3 space-y-1.5">
                {objectConnections.map(({ connection, other }) => {
                  if (!other) return null;
                  const otherRoom = roomById.get(other.roomId);
                  const otherColor = otherRoom
                    ? paletteColor(otherRoom.palette)
                    : "var(--palace-muted)";
                  return (
                    <li
                      key={connection.id}
                      className="flex items-center gap-2 rounded-md border border-border-hair bg-surface-2/50 px-3 py-1.5"
                    >
                      <span
                        className="h-2 w-2 shrink-0 rounded-full"
                        style={{ backgroundColor: otherColor }}
                        aria-hidden
                      />
                      <button
                        type="button"
                        onClick={() => openObject(other.id)}
                        className="min-w-0 flex-1 py-1.5 text-left"
                      >
                        <span className="block truncate text-sm text-text hover:text-accent">
                          {other.title}
                        </span>
                        <span className="block truncate text-2xs text-muted">
                          {connection.label ? `${connection.label} · ` : ""}
                          {otherRoom?.name ?? "Unassigned"}
                        </span>
                      </button>
                      <IconButton
                        label={`Remove connection to ${other.title}`}
                        className="hover:text-danger"
                        onClick={() => removeConnection(connection.id)}
                      >
                        <X size={14} strokeWidth={1.75} aria-hidden />
                      </IconButton>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="mb-3 text-xs text-muted">No connections yet.</p>
            )}
            <RelationshipPicker
              candidates={candidates}
              rooms={rooms}
              onPick={(toId, label) =>
                addConnection(object.id, toId, label || undefined)
              }
            />
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-border-hair px-4 py-3 sm:px-5">
          <div className="text-2xs leading-tight text-muted">
            <div>Created {new Date(object.createdAt).toLocaleDateString()}</div>
            <div>Updated {new Date(object.updatedAt).toLocaleDateString()}</div>
          </div>
          <Button variant="danger" onClick={() => setConfirmDelete(true)}>
            <Trash2 size={14} strokeWidth={1.75} aria-hidden />
            Delete
          </Button>
        </div>
      </aside>

      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={handleDelete}
        title="Delete object?"
        description={`"${object.title}" and its connections will be removed.`}
        confirmLabel="Delete"
        danger
        note="You can undo this from the toast that follows."
      />
    </>
  );
}
