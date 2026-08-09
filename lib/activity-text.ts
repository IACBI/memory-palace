import type { ActivityEvent, KnowledgeObject, Room } from "@/lib/types";

const VERB: Record<ActivityEvent["kind"], string> = {
  created: "Added",
  updated: "Edited",
  moved: "Moved",
  connected: "Connected",
  disconnected: "Disconnected",
  deleted: "Removed",
};

/**
 * Builds a readable phrase for an activity event, e.g.
 * `Moved "Fermentation log" in The Laboratory`.
 */
export function activityPhrase(
  event: ActivityEvent,
  rooms: Room[],
  objects: KnowledgeObject[],
): string {
  const verb = VERB[event.kind];
  const quoted = `"${event.targetTitle}"`;

  if (event.targetType === "room") {
    return `${verb} ${quoted}`;
  }

  const object = objects.find((candidate) => candidate.id === event.targetId);
  const room = object
    ? rooms.find((candidate) => candidate.id === object.roomId)
    : undefined;

  if (room) {
    const preposition =
      event.kind === "connected" || event.kind === "disconnected"
        ? "from"
        : "in";
    return `${verb} ${quoted} ${preposition} ${room.name}`;
  }
  return `${verb} ${quoted}`;
}

/** Formats an ISO timestamp as a compact relative time. */
export function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days}d ago`;
  // Explicitly en-US, not the reader's locale. Everything above this line is
  // English ("3d ago"), and these two formats share a column in the library
  // and the activity feed — leaving the fallback to `undefined` put "2 Şub"
  // directly under "22d ago" for anyone whose browser was not set to English.
  // The app's interface language is English; the README is the multilingual
  // surface, not this.
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}
