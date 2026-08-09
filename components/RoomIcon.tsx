"use client";

import type { LucideProps } from "lucide-react";
import {
  FALLBACK_ROOM_ICON,
  isRoomIconName,
  ROOM_ICONS,
  type RoomIconName,
} from "@/lib/icon-set";

/**
 * Renders a room's icon by name.
 *
 * Accepts a plain `string` because stored and imported data may carry a name
 * this build does not know; those fall back to a door rather than crashing.
 *
 * Imports the icons by name from `lib/icon-set`, never the lucide `icons`
 * namespace — that pulled ~2,000 untree-shakeable components onto every route
 * and cost 155 KB gzipped. A guard test in `test/lib/icon-set.test.ts` reads
 * this file and fails on any namespace import.
 */
export function RoomIcon({
  name,
  ...props
}: { name: RoomIconName | string } & LucideProps) {
  const Icon = ROOM_ICONS[isRoomIconName(name) ? name : FALLBACK_ROOM_ICON];
  return <Icon {...props} />;
}
