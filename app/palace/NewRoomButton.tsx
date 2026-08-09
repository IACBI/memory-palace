"use client";

import { Plus } from "lucide-react";
import { usePalaceStore } from "@/lib/store";
import { Button } from "@/components/ui/Button";

/**
 * Header action for creating a room.
 *
 * Signals through the store's existing `requestNewRoom` flag — the same path
 * the command palette uses — so the dialog can live in the body while the
 * button lives in the server-rendered header.
 */
export function NewRoomButton() {
  const requestNewRoom = usePalaceStore((s) => s.requestNewRoom);

  return (
    <Button variant="primary" onClick={requestNewRoom}>
      <Plus size={16} strokeWidth={2} aria-hidden />
      Add room
    </Button>
  );
}
