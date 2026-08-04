/**
 * Geometry for the connection curves drawn on a room canvas.
 *
 * Object positions are stored as percentages so a room reflows with the
 * viewport, but curves have to be drawn in pixels: a percentage-space SVG
 * scaled to a non-square canvas skews the bow and the stroke width with it.
 * Everything here converts once, up front, from the measured canvas size.
 */

export interface Point {
  x: number;
  y: number;
}

export interface CanvasSize {
  width: number;
  height: number;
}

/** How far the curve bows out, as a fraction of the distance it spans. */
const BOW = 0.14;

/** Length of the stub drawn for a connection leaving the room, in pixels. */
const STUB_LENGTH = 30;

/** Converts a stored percentage position to pixels within the canvas. */
export function toPixels(
  position: { x: number; y: number },
  size: CanvasSize,
): Point {
  return {
    x: (position.x / 100) * size.width,
    y: (position.y / 100) * size.height,
  };
}

/**
 * Control point of the quadratic curve from `a` to `b`.
 *
 * Offset perpendicular to the line so two objects are joined by an arc rather
 * than a chord — with several links crossing a small room, straight lines
 * collapse into an unreadable star.
 */
function control(a: Point, b: Point, bow: number): Point {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  return {
    x: (a.x + b.x) / 2 - dy * bow,
    y: (a.y + b.y) / 2 + dx * bow,
  };
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}

/** An `M … Q …` path for the curve between two canvas points. */
export function linkPath(a: Point, b: Point, bow: number = BOW): string {
  const c = control(a, b, bow);
  return `M ${round(a.x)} ${round(a.y)} Q ${round(c.x)} ${round(c.y)} ${round(b.x)} ${round(b.y)}`;
}

/**
 * The point halfway along that curve, where a label sits.
 *
 * This is the curve at t=0.5, not the midpoint of the straight line: on a
 * bowed path those are noticeably different, and a label pinned to the chord
 * floats away from the line it belongs to.
 */
export function linkMidpoint(a: Point, b: Point, bow: number = BOW): Point {
  const c = control(a, b, bow);
  return {
    x: (a.x + 2 * c.x + b.x) / 4,
    y: (a.y + 2 * c.y + b.y) / 4,
  };
}

/** Unit vector from `point` toward the closest edge of the canvas. */
export function nearestEdgeDirection(point: Point, size: CanvasSize): Point {
  const distances = [
    { d: point.x, v: { x: -1, y: 0 } },
    { d: size.width - point.x, v: { x: 1, y: 0 } },
    { d: point.y, v: { x: 0, y: -1 } },
    { d: size.height - point.y, v: { x: 0, y: 1 } },
  ];
  return distances.reduce((best, next) => (next.d < best.d ? next : best)).v;
}

/**
 * A short line leaving the canvas edge-wards.
 *
 * Connections to objects in other rooms have no second endpoint to draw to,
 * but hiding them entirely makes a well-connected object look isolated.
 */
export function stubPath(
  from: Point,
  size: CanvasSize,
  length: number = STUB_LENGTH,
): string {
  const direction = nearestEdgeDirection(from, size);
  const to = {
    x: from.x + direction.x * length,
    y: from.y + direction.y * length,
  };
  return `M ${round(from.x)} ${round(from.y)} L ${round(to.x)} ${round(to.y)}`;
}

/** End point of the stub, where its terminating dot is drawn. */
export function stubEnd(
  from: Point,
  size: CanvasSize,
  length: number = STUB_LENGTH,
): Point {
  const direction = nearestEdgeDirection(from, size);
  return {
    x: from.x + direction.x * length,
    y: from.y + direction.y * length,
  };
}
