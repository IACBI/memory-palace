"use client";

import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { usePalaceStore } from "@/lib/store";
import { useToastStore } from "@/lib/toast-store";
import { PageHeader } from "@/components/shell/PageHeader";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { RoomChamber } from "@/components/palace/RoomChamber";
import { RoomDialog, type RoomDraft } from "@/components/palace/RoomDialog";
import { GRID_COLS, GRID_ROWS, findFreeSlot } from "@/lib/layout";
import type { Room } from "@/lib/types";

const NEW_ROOM_W = 2;
const NEW_ROOM_H = 2;

export default function PalacePage() {
  const rooms = usePalaceStore((s) => s.rooms);
  const objects = usePalaceStore((s) => s.objects);
  const createRoom = usePalaceStore((s) => s.createRoom);
  const updateRoom = usePalaceStore((s) => s.updateRoom);
  const deleteRoom = usePalaceStore((s) => s.deleteRoom);
  const newRoomRequested = usePalaceStore((s) => s.newRoomRequested);
  const clearNewRoomRequest = usePalaceStore((s) => s.clearNewRoomRequest);
  const addToast = useToastStore((s) => s.addToast);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editRoom, setEditRoom] = useState<Room | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Room | null>(null);
  const [seenRequest, setSeenRequest] = useState(false);

  // Open the create dialog when the command palette requests a new room
  // (adjust-during-render — no effect needed).
  if (newRoomRequested && !seenRequest) {
    setSeenRequest(true);
    setEditRoom(null);
    setDialogOpen(true);
  } else if (!newRoomRequested && seenRequest) {
    setSeenRequest(false);
  }

  const objectsByRoom = useMemo(() => {
    const map = new Map<string, typeof objects>();
    for (const o of objects) {
      const list = map.get(o.roomId);
      if (list) list.push(o);
      else map.set(o.roomId, [o]);
    }
    return map;
  }, [objects]);
  const objectsFor = (roomId: string) => objectsByRoom.get(roomId) ?? [];

  const openCreate = () => {
    setEditRoom(null);
    setDialogOpen(true);
  };

  const openEdit = (room: Room) => {
    setEditRoom(room);
    setDialogOpen(true);
  };

  const handleSubmit = (draft: RoomDraft) => {
    if (editRoom) {
      updateRoom(editRoom.id, draft);
      addToast({ message: `Saved "${draft.name}"`, variant: "success" });
    } else {
      const position = findFreeSlot(rooms, NEW_ROOM_W, NEW_ROOM_H);
      createRoom({ ...draft, position });
      addToast({ message: `Created "${draft.name}"`, variant: "success" });
    }
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    const name = deleteTarget.name;
    deleteRoom(deleteTarget.id);
    addToast({ message: `Removed "${name}" and its objects` });
  };

  return (
    <div className="mx-auto max-w-6xl px-5 py-10 sm:px-8">
      <PageHeader
        title="The Palace"
        subtitle="Your rooms, laid out as a floor plan. Click a chamber to enter."
      >
        <Button variant="primary" onClick={openCreate}>
          <Plus size={16} strokeWidth={2} />
          Add room
        </Button>
      </PageHeader>

      <div className="mt-8 overflow-x-auto">
        <div
          className="palace-floor relative mx-auto grid aspect-[3/2] w-full min-w-[680px] gap-2 rounded-2xl border border-border-hair p-3"
          style={{
            gridTemplateColumns: `repeat(${GRID_COLS}, minmax(0, 1fr))`,
            gridTemplateRows: `repeat(${GRID_ROWS}, minmax(0, 1fr))`,
          }}
        >
          {rooms.map((room) => (
            <RoomChamber
              key={room.id}
              room={room}
              objects={objectsFor(room.id)}
              onEdit={() => openEdit(room)}
              onDelete={() => setDeleteTarget(room)}
            />
          ))}
        </div>
      </div>

      <RoomDialog
        open={dialogOpen}
        onClose={() => {
          setDialogOpen(false);
          if (newRoomRequested) clearNewRoomRequest();
        }}
        onSubmit={handleSubmit}
        mode={editRoom ? "edit" : "create"}
        initial={
          editRoom
            ? {
                name: editRoom.name,
                description: editRoom.description,
                icon: editRoom.icon,
                palette: editRoom.palette,
              }
            : undefined
        }
      />

      <ConfirmDialog
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete room?"
        description={
          deleteTarget
            ? `"${deleteTarget.name}" and all ${objectsFor(deleteTarget.id).length} of its objects will be removed.`
            : undefined
        }
        confirmLabel="Delete room"
        danger
      />
    </div>
  );
}
