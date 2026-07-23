"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Pencil, Trash2, Plus, Package } from "lucide-react";
import { usePalaceStore } from "@/lib/store";
import { useToastStore } from "@/lib/toast-store";
import { RoomIcon } from "@/components/RoomIcon";
import { paletteColor } from "@/lib/palette";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { RoomDialog, type RoomDraft } from "@/components/palace/RoomDialog";
import { ObjectCard } from "@/components/room/ObjectCard";
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
  const addToast = useToastStore((s) => s.addToast);

  const canvasRef = useRef<HTMLDivElement>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteRoomOpen, setDeleteRoomOpen] = useState(false);
  const [deleteObjTarget, setDeleteObjTarget] =
    useState<KnowledgeObject | null>(null);

  const room = useMemo(
    () => rooms.find((r) => r.id === roomId),
    [rooms, roomId],
  );
  const objects = useMemo(
    () => (room ? allObjects.filter((o) => o.roomId === room.id) : []),
    [allObjects, room],
  );

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
              style={{ backgroundColor: `${color}22`, color }}
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
              backgroundColor: `${color}12`,
              boxShadow: `inset 0 0 140px 10px ${color}14`,
            }}
          >
            {objects.map((object) => (
              <ObjectCard
                key={object.id}
                object={object}
                accent={color}
                canvasRef={canvasRef}
                onOpen={openObject}
                onRequestDelete={setDeleteObjTarget}
              />
            ))}
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
