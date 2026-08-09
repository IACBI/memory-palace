"use client";

import { useMemo, useState } from "react";
import { Castle } from "lucide-react";
import { usePalaceStore } from "@/lib/store";
import { useToastStore } from "@/lib/toast-store";
import { useHydrated } from "@/lib/hooks/use-hydrated";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { RoomChamber } from "@/components/palace/RoomChamber";
import { RoomDialog, type RoomDraft } from "@/components/palace/RoomDialog";
import { PalaceSkeleton } from "@/components/skeletons/RouteSkeletons";
import { ImmersiveToggle } from "@/components/shell/ImmersiveToggle";
import { GRID_COLS, GRID_ROWS, findFreeSlot } from "@/lib/layout";
import type { Room } from "@/lib/types";

const NEW_ROOM_W = 2;
const NEW_ROOM_H = 2;

export function PalaceBody() {
  const hydrated = useHydrated();
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

  // Open the create dialog when the header button or command palette asks for
  // a new room (adjust-during-render — no effect needed).
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

  const openEdit = (room: Room) => {
    setEditRoom(room);
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    if (newRoomRequested) clearNewRoomRequest();
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

  if (!hydrated) return <PalaceSkeleton />;

  return (
    <>
      {rooms.length === 0 ? (
        <div className="absolute inset-0 flex items-center justify-center p-6">
          <EmptyState
            icon={Castle}
            title="An empty floor plan"
            hint="Rooms are how the palace holds what you know. Add your first chamber and give it a name."
            action={
              <Button variant="primary" onClick={() => setDialogOpen(true)}>
                Create a room
              </Button>
            }
          />
        </div>
      ) : (
        // The plan takes the window rather than a 3:2 card in a reading column
        // — a floor plan of a place should read as the floor of a place. It
        // still scrolls sideways below its minimum width; squeezing 12 columns
        // onto a phone makes every chamber unreadable instead. `min-h` keeps a
        // usable plan on a short window, where the stage alone would flatten
        // the chambers into strips.
        <div className="absolute inset-0 overflow-auto p-4 pt-20 sm:p-6 sm:pt-24">
          <div
            className="palace-floor relative grid h-full min-h-105 w-full min-w-[680px] gap-2 rounded-xl border border-border-hair p-3"
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
      )}

      <div className="absolute right-3 bottom-3 z-[var(--z-raised)] rounded-md border border-border-hair bg-surface/90 p-1 backdrop-blur-md">
        <ImmersiveToggle />
      </div>

      <RoomDialog
        open={dialogOpen}
        onClose={closeDialog}
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
    </>
  );
}
