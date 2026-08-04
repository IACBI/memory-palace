"use client";

import { useCallback, useEffect, useId, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Pencil,
  Trash2,
  Plus,
  Package,
  Spline,
  X,
} from "lucide-react";
import { usePalaceStore } from "@/lib/store";
import { useToastStore } from "@/lib/toast-store";
import { RoomIcon } from "@/components/RoomIcon";
import { paletteColor, paletteTint } from "@/lib/palette";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { RoomDialog, type RoomDraft } from "@/components/palace/RoomDialog";
import { ObjectCard } from "@/components/room/ObjectCard";
import { ConnectionLayer } from "@/components/room/ConnectionLayer";
import { linkMidpoint, toPixels, type Point } from "@/lib/canvas-links";
import { useElementSize } from "@/lib/hooks/use-element-size";
import { useDismissable } from "@/lib/hooks/use-dismissable";
import type { KnowledgeObject } from "@/lib/types";

export function RoomView() {
  const searchParams = useSearchParams();
  const roomId = searchParams.get("r") ?? "";
  const router = useRouter();

  const rooms = usePalaceStore((s) => s.rooms);
  const allObjects = usePalaceStore((s) => s.objects);
  const createObject = usePalaceStore((s) => s.createObject);
  const deleteObject = usePalaceStore((s) => s.deleteObject);
  const restoreObject = usePalaceStore((s) => s.restoreObject);
  const updateRoom = usePalaceStore((s) => s.updateRoom);
  const deleteRoom = usePalaceStore((s) => s.deleteRoom);
  const openObject = usePalaceStore((s) => s.openObject);
  const connections = usePalaceStore((s) => s.connections);
  const addConnection = usePalaceStore((s) => s.addConnection);
  const removeConnection = usePalaceStore((s) => s.removeConnection);
  const addToast = useToastStore((s) => s.addToast);

  const {
    size: canvasSize,
    ref: canvasRef,
    node: canvas,
  } = useElementSize<HTMLDivElement>();
  const canvasHelpId = useId();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteRoomOpen, setDeleteRoomOpen] = useState(false);
  const [deleteObjTarget, setDeleteObjTarget] =
    useState<KnowledgeObject | null>(null);

  /** The object a new connection is being drawn from, if any. */
  const [linkSourceId, setLinkSourceId] = useState<string | null>(null);
  /** Where the pointer is, while dragging a link. Null for keyboard linking. */
  const [linkPointer, setLinkPointer] = useState<Point | null>(null);
  /** Whether the link is being dragged rather than driven from the keyboard. */
  const [draggingLink, setDraggingLink] = useState(false);
  const [selectedConnectionId, setSelectedConnectionId] = useState<
    string | null
  >(null);
  const [announcement, setAnnouncement] = useState("");

  const room = useMemo(
    () => rooms.find((r) => r.id === roomId),
    [rooms, roomId],
  );
  const objects = useMemo(
    () => (room ? allObjects.filter((o) => o.roomId === room.id) : []),
    [allObjects, room],
  );

  const objectsById = useMemo(
    () => new Map(objects.map((object) => [object.id, object])),
    [objects],
  );

  /** Connections with at least one end on this canvas. */
  const roomConnections = useMemo(
    () =>
      connections.filter(
        (connection) =>
          objectsById.has(connection.fromId) ||
          objectsById.has(connection.toId),
      ),
    [connections, objectsById],
  );

  const cancelLink = useCallback(() => {
    setLinkSourceId(null);
    setLinkPointer(null);
    setDraggingLink(false);
  }, []);

  const startLink = useCallback(
    (id: string, pointer?: { x: number; y: number }) => {
      setLinkSourceId(id);
      const rect = canvas?.getBoundingClientRect();
      setDraggingLink(pointer !== undefined);
      setLinkPointer(
        pointer && rect
          ? { x: pointer.x - rect.left, y: pointer.y - rect.top }
          : null,
      );
      const title = objectsById.get(id)?.title ?? "this object";
      setAnnouncement(
        `Connecting from ${title}. Focus another object and press Enter, or press Escape to cancel.`,
      );
    },
    [objectsById, canvas],
  );

  const completeLink = useCallback(
    (targetId: string) => {
      const sourceId = linkSourceId;
      cancelLink();
      if (!sourceId || sourceId === targetId) return;

      const source = objectsById.get(sourceId);
      const target = objectsById.get(targetId);
      const created = addConnection(sourceId, targetId);

      if (created) {
        setAnnouncement(`Connected ${source?.title} to ${target?.title}.`);
        addToast({
          message: `Connected “${source?.title}” to “${target?.title}”`,
          variant: "success",
        });
      } else {
        setAnnouncement("Those two are already connected.");
        addToast({ message: "Those two are already connected." });
      }
    },
    [linkSourceId, objectsById, addConnection, addToast, cancelLink],
  );

  // Escape cancels the link in progress, ahead of anything below it.
  useDismissable(linkSourceId !== null, cancelLink);
  useDismissable(selectedConnectionId !== null, () =>
    setSelectedConnectionId(null),
  );

  /**
   * Clicking bare canvas clears a selected curve.
   *
   * A native listener rather than an `onClick` on the canvas element: this is
   * a pointer convenience whose keyboard equivalent is Escape, above, and
   * attaching a click handler to a plain `div` would claim otherwise.
   */
  useEffect(() => {
    if (!canvas) return;

    const onPointerDown = (event: PointerEvent) => {
      if (event.target !== canvas) return;
      setSelectedConnectionId(null);
      cancelLink();
    };

    canvas.addEventListener("pointerdown", onPointerDown);
    return () => canvas.removeEventListener("pointerdown", onPointerDown);
  }, [canvas, cancelLink]);

  /**
   * Pointer linking is tracked on the window rather than the canvas: releasing
   * outside the canvas has to cancel, and a pointer that leaves the element
   * stops delivering events to it.
   */
  useEffect(() => {
    if (linkSourceId === null || !draggingLink) return;

    const onMove = (event: PointerEvent) => {
      const rect = canvas?.getBoundingClientRect();
      if (!rect) return;
      setLinkPointer({
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
      });
    };

    const onUp = (event: PointerEvent) => {
      const element = document.elementFromPoint(event.clientX, event.clientY);
      const card = element?.closest<HTMLElement>("[data-object-id]");
      const targetId = card?.dataset.objectId;
      if (targetId) completeLink(targetId);
      else cancelLink();
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [linkSourceId, draggingLink, canvas, completeLink, cancelLink]);

  // A connection can disappear from under the selection — undo, or the other
  // end being deleted in the editor.
  const selectedConnection =
    roomConnections.find(
      (connection) => connection.id === selectedConnectionId,
    ) ?? null;

  const linkSource = linkSourceId ? objectsById.get(linkSourceId) : undefined;
  const linkDraft =
    linkSource && linkPointer
      ? { from: toPixels(linkSource.position, canvasSize), to: linkPointer }
      : null;

  const selectedEnds = selectedConnection
    ? [
        objectsById.get(selectedConnection.fromId),
        objectsById.get(selectedConnection.toId),
      ]
    : [];
  const selectedMidpoint =
    selectedEnds[0] && selectedEnds[1]
      ? linkMidpoint(
          toPixels(selectedEnds[0].position, canvasSize),
          toPixels(selectedEnds[1].position, canvasSize),
        )
      : null;

  if (!room) {
    return (
      <div className="mx-auto max-w-3xl px-5 py-24 sm:px-8">
        <div className="rounded-2xl border border-border-hair bg-surface p-8 text-center sm:p-12">
          <h1 className="font-display text-3xl text-text">Room not found</h1>
          <p className="mt-3 text-sm text-muted">
            There is no room with the id{" "}
            <code className="rounded bg-surface-2 px-1.5 py-0.5 text-xs text-text">
              {roomId}
            </code>
            . It may have been deleted.
          </p>
          <Link
            href="/palace"
            className="mt-6 inline-flex items-center gap-2 rounded-lg border border-border-strong px-4 py-2 text-sm text-text transition-colors hover:bg-surface-2"
          >
            <ArrowLeft size={16} strokeWidth={1.75} />
            Back to the palace
          </Link>
        </div>
      </div>
    );
  }

  const color = paletteColor(room.palette);

  const handleAddObject = () => {
    const created = createObject({
      roomId: room.id,
      type: "note",
      title: "New object",
      position: { x: 30 + Math.random() * 40, y: 30 + Math.random() * 40 },
    });
    openObject(created.id);
  };

  const handleEditRoom = (draft: RoomDraft) => {
    updateRoom(room.id, draft);
    addToast({ message: `Saved "${draft.name}"`, variant: "success" });
  };

  const handleDeleteRoom = () => {
    const name = room.name;
    deleteRoom(room.id);
    addToast({ message: `Removed "${name}" and its objects` });
    router.push("/palace");
  };

  const handleDeleteObject = () => {
    if (!deleteObjTarget) return;
    const snapshot = deleteObjTarget;
    const related = connections.filter(
      (c) => c.fromId === snapshot.id || c.toId === snapshot.id,
    );
    deleteObject(snapshot.id);
    addToast({
      message: `Removed "${snapshot.title}"`,
      action: {
        label: "Undo",
        onClick: () => restoreObject(snapshot, related),
      },
    });
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col">
      {/* Header */}
      <div className="border-b border-border-hair px-5 py-6 sm:px-8">
        <Link
          href="/palace"
          className="mb-4 inline-flex items-center gap-2 text-sm text-muted transition-colors hover:text-text"
        >
          <ArrowLeft size={16} strokeWidth={1.75} />
          Palace
        </Link>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <span
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl"
              style={{
                backgroundColor: paletteTint(room.palette, "chip"),
                color,
              }}
            >
              <RoomIcon name={room.icon} size={24} strokeWidth={1.75} />
            </span>
            <div className="min-w-0">
              <h1 className="font-display text-3xl leading-none font-semibold tracking-wide text-text">
                {room.name}
              </h1>
              <p className="mt-1.5 max-w-xl text-sm text-muted">
                {room.description}
              </p>
              <p className="mt-1 text-xs tracking-widest text-muted uppercase">
                {objects.length} {objects.length === 1 ? "object" : "objects"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => setEditOpen(true)}>
              <Pencil size={14} strokeWidth={1.75} />
              Edit
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={() => setDeleteRoomOpen(true)}
            >
              <Trash2 size={14} strokeWidth={1.75} />
              Delete
            </Button>
            <Button variant="primary" size="sm" onClick={handleAddObject}>
              <Plus size={16} strokeWidth={2} />
              Add object
            </Button>
          </div>
        </div>
      </div>

      {/* Spatial canvas */}
      <div className="relative flex-1 overflow-hidden p-4 sm:p-6">
        {/* Announces link progress to a screen reader without moving focus. */}
        <span aria-live="polite" className="sr-only">
          {announcement}
        </span>

        {linkSource ? (
          <div className="motion-toast-in absolute inset-x-0 top-6 z-40 mx-auto flex w-fit items-center gap-3 rounded-full border border-accent-dim bg-surface px-4 py-2 text-sm shadow-[0_12px_40px_-8px_rgba(0,0,0,0.6)]">
            <Spline size={15} strokeWidth={1.75} className="text-accent" />
            <span className="text-text">
              Connecting from{" "}
              <span className="text-accent">{linkSource.title}</span> — choose
              another object
            </span>
            <button
              type="button"
              onClick={cancelLink}
              className="rounded-md px-2 py-0.5 text-xs text-muted transition-colors hover:bg-surface-2 hover:text-text"
            >
              Cancel
            </button>
          </div>
        ) : null}

        {objects.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <EmptyState
              icon={Package}
              title="This room is empty"
              hint="Add your first object and place it anywhere on the canvas."
              action={
                <Button variant="primary" onClick={handleAddObject}>
                  <Plus size={16} strokeWidth={2} />
                  Add object
                </Button>
              }
            />
          </div>
        ) : (
          <div
            ref={canvasRef}
            className="room-canvas-grain relative h-full w-full rounded-2xl border border-border-hair"
            style={{
              backgroundColor: paletteTint(room.palette, "wash"),
              boxShadow: `inset 0 0 140px 10px ${paletteTint(room.palette, "wash")}`,
            }}
          >
            <ConnectionLayer
              connections={roomConnections}
              objectsById={objectsById}
              size={canvasSize}
              palette={room.palette}
              selectedId={selectedConnectionId}
              draft={linkDraft}
              onSelect={setSelectedConnectionId}
            />

            {objects.map((object) => (
              <ObjectCard
                key={object.id}
                object={object}
                palette={room.palette}
                canvas={canvas}
                instructionsId={canvasHelpId}
                linking={linkSourceId !== null}
                isLinkSource={linkSourceId === object.id}
                onOpen={openObject}
                onRequestDelete={setDeleteObjTarget}
                onStartLink={startLink}
                onLinkTo={completeLink}
                onCancelLink={cancelLink}
              />
            ))}

            {/* Actions for the selected curve, floating at its midpoint. The
                same connection can be relabelled and removed from the object
                editor, which is the keyboard path. */}
            {selectedConnection && selectedMidpoint ? (
              <div
                className="motion-menu-in absolute z-30 flex -translate-x-1/2 -translate-y-1/2 items-center gap-1 rounded-lg border border-border-strong bg-surface px-1.5 py-1 shadow-[0_12px_40px_-8px_rgba(0,0,0,0.6)]"
                style={{ left: selectedMidpoint.x, top: selectedMidpoint.y }}
              >
                <span className="max-w-40 truncate px-1.5 text-xs text-muted">
                  {selectedConnection.label || "Connection"}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    removeConnection(selectedConnection.id);
                    setSelectedConnectionId(null);
                    addToast({ message: "Connection removed." });
                  }}
                  className="flex h-6 w-6 items-center justify-center rounded-md text-muted transition-colors hover:bg-surface-2 hover:text-danger"
                  aria-label="Remove this connection"
                >
                  <Trash2 size={13} strokeWidth={1.75} />
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedConnectionId(null)}
                  className="flex h-6 w-6 items-center justify-center rounded-md text-muted transition-colors hover:bg-surface-2 hover:text-text"
                  aria-label="Dismiss"
                >
                  <X size={13} strokeWidth={1.75} />
                </button>
              </div>
            ) : null}

            {/* Described once for the whole canvas rather than repeated into
                every card's accessible name. */}
            <p id={canvasHelpId} className="sr-only">
              Press Enter to edit, arrow keys to move the object, Shift and an
              arrow key to move further, L to start a connection from it, Delete
              to remove it.
            </p>
          </div>
        )}
      </div>

      <RoomDialog
        open={editOpen}
        onClose={() => setEditOpen(false)}
        onSubmit={handleEditRoom}
        mode="edit"
        initial={{
          name: room.name,
          description: room.description,
          icon: room.icon,
          palette: room.palette,
        }}
      />

      <ConfirmDialog
        open={deleteRoomOpen}
        onClose={() => setDeleteRoomOpen(false)}
        onConfirm={handleDeleteRoom}
        title="Delete room?"
        description={`"${room.name}" and all ${objects.length} of its objects will be removed.`}
        confirmLabel="Delete room"
        danger
      />

      <ConfirmDialog
        open={deleteObjTarget !== null}
        onClose={() => setDeleteObjTarget(null)}
        onConfirm={handleDeleteObject}
        title="Delete object?"
        description={
          deleteObjTarget
            ? `"${deleteObjTarget.title}" will be removed.`
            : undefined
        }
        confirmLabel="Delete"
        danger
        note="You can undo this from the toast that follows."
      />
    </div>
  );
}
