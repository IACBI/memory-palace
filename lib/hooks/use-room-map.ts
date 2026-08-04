"use client";

import { useMemo } from "react";
import type { Room } from "@/lib/types";

/**
 * Rooms indexed by id.
 *
 * Six screens needed this and each built its own; two of them rebuilt it on
 * every render, which for the object editor meant once per keystroke.
 */
export function useRoomMap(rooms: Room[]): Map<string, Room> {
  return useMemo(() => new Map(rooms.map((room) => [room.id, room])), [rooms]);
}
