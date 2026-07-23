"use client";

import { useEffect, useRef, useState } from "react";
import {
  X,
  ExternalLink,
  Pin,
  Trash2,
  Check,
  Link as LinkIcon,
} from "lucide-react";
import { usePalaceStore } from "@/lib/store";
import { useToastStore } from "@/lib/toast-store";
import type { KnowledgeObject, ObjectType } from "@/lib/types";
import { OBJECT_TYPE_META, OBJECT_TYPES } from "@/lib/object-meta";
import { paletteColor } from "@/lib/palette";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { TagInput } from "./TagInput";
import { RelationshipPicker } from "./RelationshipPicker";

export function ObjectEditor() {
  const activeObjectId = usePalaceStore((s) => s.activeObjectId);
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

  const object = objects.find((o) => o.id === activeObjectId) ?? null;
  const objectId = object?.id ?? null;

  const [saved, setSaved] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const savedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const titleRef = useRef<HTMLInputElement>(null);

  // Focus the title shortly after a new object opens.
  useEffect(() => {
    if (!objectId) return;
    const t = setTimeout(() => titleRef.current?.focus(), 60);
    return () => clearTimeout(t);
  }, [objectId]);

  // Esc closes the panel.
  useEffect(() => {
    if (!objectId) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeObject();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [objectId, closeObject]);

  if (!object) return null;

  const flashSaved = () => {
    setSaved(true);
    if (savedTimer.current) clearTimeout(savedTimer.current);
    savedTimer.current = setTimeout(() => setSaved(false), 1600);
  };

  const commit = (patch: Partial<KnowledgeObject>) => {
    updateObject(object.id, patch);
    flashSaved();
  };

  const room = rooms.find((r) => r.id === object.roomId);
  const accent = room ? paletteColor(room.palette) : "var(--palace-accent)";
  const roomById = new Map(rooms.map((r) => [r.id, r]));

  const objectConnections = connections
    .filter((c) => c.fromId === object.id || c.toId === object.id)
    .map((c) => {
      const otherId = c.fromId === object.id ? c.toId : c.fromId;
      return { connection: c, other: objects.find((o) => o.id === otherId) };
    })
    .filter((entry) => entry.other);

  const connectedIds = new Set(objectConnections.map((entry) => entry.other?.id));
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
        className="animate-[fadeIn_180ms_ease-out] fixed inset-0 z-40 bg-black/50 md:bg-black/20"
        onClick={closeObject}
        aria-hidden
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-label={`Edit ${object.title || "object"}`}
        className="animate-[slideOverIn_220ms_ease-out] fixed top-0 right-0 z-50 flex h-full w-full max-w-[420px] flex-col border-l border-border-strong bg-surface"
        style={{ boxShadow: `inset 4px 0 0 0 ${accent}, -24px 0 80px -24px rgba(0,0,0,0.8)` }}
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-2 border-b border-border-hair px-5 py-4">
          <div className="flex items-center gap-2 text-xs text-muted">
            {room ? (
              <>
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: accent }}
                  aria-hidden
                />
                <span>{room.name}</span>
              </>
            ) : (
              <span>Object</span>
            )}
            <span
              className={`ml-2 inline-flex items-center gap-1 text-accent transition-opacity duration-300 ${
                saved ? "opacity-100" : "opacity-0"
              }`}
              aria-live="polite"
            >
              <Check size={12} strokeWidth={2.25} /> Saved
            </span>
          </div>
          <button
            type="button"
            onClick={closeObject}
            aria-label="Close editor"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted transition-colors hover:bg-surface-2 hover:text-text"
          >
            <X size={16} strokeWidth={1.75} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5">
          {/* Title */}
          <Input
            ref={titleRef}
            value={object.title}
            onChange={(e) => commit({ title: e.target.value })}
            placeholder="Untitled"
            className="!text-lg font-display"
            aria-label="Title"
          />

          {/* Type selector */}
          <div>
            <label className="mb-1.5 block text-xs tracking-widest text-muted uppercase">
              Type
            </label>
            <div className="grid grid-cols-4 gap-1.5">
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
                    className={`flex flex-col items-center gap-1 rounded-lg border px-2 py-2 text-[11px] transition-colors ${
                      active
                        ? "border-accent-dim bg-surface-2 text-text"
                        : "border-border-hair text-muted hover:border-border-strong hover:text-text"
                    }`}
                  >
                    <Glyph size={16} strokeWidth={1.75} />
                    {meta.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Content */}
          <div>
            <label className="mb-1.5 block text-xs tracking-widest text-muted uppercase">
              Content
            </label>
            <Textarea
              autoGrow
              rows={4}
              value={object.content}
              onChange={(e) => commit({ content: e.target.value })}
              placeholder="Write something…"
              aria-label="Content"
            />
          </div>

          {/* URL (link type) */}
          {object.type === "link" ? (
            <div>
              <label className="mb-1.5 block text-xs tracking-widest text-muted uppercase">
                URL
              </label>
              <Input
                value={object.url ?? ""}
                onChange={(e) => commit({ url: e.target.value })}
                placeholder="https://…"
                inputMode="url"
                aria-label="URL"
              />
              {object.url ? (
                <a
                  href={object.url}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 flex items-center gap-2 rounded-lg border border-border-hair bg-surface-2/60 px-3 py-2 text-xs text-muted transition-colors hover:text-text"
                >
                  <LinkIcon size={13} strokeWidth={1.75} />
                  <span className="min-w-0 flex-1 truncate">{object.url}</span>
                  <ExternalLink size={13} strokeWidth={1.75} />
                </a>
              ) : null}
            </div>
          ) : null}

          {/* File name (file type) */}
          {object.type === "file" ? (
            <div>
              <label className="mb-1.5 block text-xs tracking-widest text-muted uppercase">
                File name
              </label>
              <Input
                value={object.fileName ?? ""}
                onChange={(e) => commit({ fileName: e.target.value })}
                placeholder="document.pdf"
                aria-label="File name"
              />
            </div>
          ) : null}

          {/* Tags */}
          <div>
            <label className="mb-1.5 block text-xs tracking-widest text-muted uppercase">
              Tags
            </label>
            <TagInput
              value={object.tags}
              onChange={(next) => commit({ tags: next })}
              suggestions={allTags}
            />
          </div>

          {/* Room + pin */}
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <label className="mb-1.5 block text-xs tracking-widest text-muted uppercase">
                Room
              </label>
              <Select
                value={object.roomId}
                onChange={(e) => commit({ roomId: e.target.value })}
                aria-label="Room"
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
              className={`flex h-10 items-center gap-2 rounded-lg border px-3 text-sm transition-colors ${
                object.pinned
                  ? "border-accent-dim bg-surface-2 text-accent"
                  : "border-border-hair text-muted hover:border-border-strong hover:text-text"
              }`}
            >
              <Pin size={15} strokeWidth={1.75} />
              {object.pinned ? "Pinned" : "Pin"}
            </button>
          </div>

          {/* Relationships */}
          <div className="border-t border-border-hair pt-5">
            <h3 className="mb-2 font-display text-lg tracking-wide text-text">
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
                      className="flex items-center gap-2 rounded-lg border border-border-hair bg-surface-2/50 px-3 py-2"
                    >
                      <span
                        className="h-2 w-2 shrink-0 rounded-full"
                        style={{ backgroundColor: otherColor }}
                        aria-hidden
                      />
                      <button
                        type="button"
                        onClick={() => openObject(other.id)}
                        className="min-w-0 flex-1 text-left"
                      >
                        <span className="block truncate text-sm text-text hover:text-accent">
                          {other.title}
                        </span>
                        <span className="block truncate text-[11px] text-muted">
                          {connection.label ? `${connection.label} · ` : ""}
                          {otherRoom?.name ?? "Unassigned"}
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => removeConnection(connection.id)}
                        aria-label={`Remove connection to ${other.title}`}
                        className="flex h-6 w-6 items-center justify-center rounded-md text-muted transition-colors hover:bg-surface hover:text-danger"
                      >
                        <X size={14} strokeWidth={1.75} />
                      </button>
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

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 border-t border-border-hair px-5 py-4">
          <div className="text-[11px] leading-tight text-muted">
            <div>Created {new Date(object.createdAt).toLocaleDateString()}</div>
            <div>Updated {new Date(object.updatedAt).toLocaleDateString()}</div>
          </div>
          <Button variant="danger" size="sm" onClick={() => setConfirmDelete(true)}>
            <Trash2 size={14} strokeWidth={1.75} />
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
