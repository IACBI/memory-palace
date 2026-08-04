import type { Connection, KnowledgeObject } from "@/lib/types";

/**
 * A stable signature of the graph's *shape* — which nodes exist and what links
 * them — deliberately excluding anything cosmetic.
 *
 * The force simulation keys off this instead of the arrays. The store replaces
 * `objects` on every mutation, so without it a single keystroke in the object
 * editor tore down the layout and re-ran hundreds of synchronous force ticks
 * while the user was typing.
 */
export function graphSignature(
  objects: Pick<KnowledgeObject, "id">[],
  connections: Pick<Connection, "fromId" | "toId">[],
): string {
  // JSON rather than joined strings: with a delimiter, an id containing that
  // delimiter collides with two separate ids, and a collision means the layout
  // silently fails to rebuild.
  return JSON.stringify([
    objects.map((o) => o.id),
    connections.map((c) => [c.fromId, c.toId]),
  ]);
}
