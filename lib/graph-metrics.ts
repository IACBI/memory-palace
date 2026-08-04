/** Shared sizing rules for the knowledge graph. */

const BASE_RADIUS = 5;
const DEGREE_SCALE = 4;

/**
 * Radius of a node, by how many connections it has.
 *
 * Square-root rather than linear. Area grows with r², so a linear radius makes
 * a well-connected node look far more important than it is — and at twelve
 * connections it became a thirty-pixel blob that crowded the whole canvas.
 * Under sqrt, area is proportional to degree, which is what the eye reads.
 */
export function nodeRadius(degree: number): number {
  return BASE_RADIUS + Math.sqrt(Math.max(0, degree)) * DEGREE_SCALE;
}

/** Spacing the collision force needs to keep two nodes from overlapping. */
export function collisionRadius(degree: number): number {
  return nodeRadius(degree) + 6;
}

/**
 * Ids of the most connected nodes, for labels that stay visible at rest.
 *
 * A graph where nothing is named until you hover it is a decoration. Labelling
 * everything is unreadable. Naming the hubs gives the picture an anchor.
 * Ties are broken by id so the choice does not flicker between renders.
 */
export function hubIds(
  nodes: readonly { id: string; degree: number }[],
  count: number,
): Set<string> {
  return new Set(
    [...nodes]
      .filter((node) => node.degree > 0)
      .sort((a, b) => b.degree - a.degree || a.id.localeCompare(b.id))
      .slice(0, Math.max(0, count))
      .map((node) => node.id),
  );
}

/** How many hubs to name, scaled to the size of the graph. */
export function hubCount(total: number): number {
  if (total <= 6) return 0;
  return Math.min(6, Math.round(total / 8) + 1);
}
