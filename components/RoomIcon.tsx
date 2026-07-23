"use client";

import { DoorOpen, icons, type LucideProps } from "lucide-react";

/**
 * Renders a lucide icon by its string name (as stored on a Room).
 * Falls back to a door icon when the name is unknown.
 */
export function RoomIcon({ name, ...props }: { name: string } & LucideProps) {
  const Icon = (icons as Record<string, React.ComponentType<LucideProps>>)[name] ?? DoorOpen;
  return <Icon {...props} />;
}
