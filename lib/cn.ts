type ClassValue = string | false | null | undefined;

/**
 * Joins class names, dropping anything falsy.
 *
 * Deliberately not `clsx` + `tailwind-merge`: this app composes classes in one
 * direction only — a component's own classes first, the caller's `className`
 * last — so the later declaration wins by CSS source order and there is nothing
 * for a merge step to resolve. Two dependencies and ~8 KB to replace six lines
 * would have to earn their place against a first-load budget.
 */
export function cn(...values: ClassValue[]): string {
  return values.filter(Boolean).join(" ");
}
