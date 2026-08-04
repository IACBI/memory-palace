import { readdirSync, statSync } from "node:fs";
import { join } from "node:path";

/** Absolute path to the repository root. */
export const REPO_ROOT = join(import.meta.dirname, "..");

/**
 * Drops comments from source before scanning it.
 *
 * Guard tests look for patterns that the modules enforcing them also describe
 * in their own documentation; without this every guard flags itself.
 */
export function stripComments(source: string): string {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .split("\n")
    .filter((line) => {
      const trimmed = line.trimStart();
      return !trimmed.startsWith("//") && !trimmed.startsWith("*");
    })
    .join("\n");
}

/** Every `.ts`/`.tsx` file under `dir`, recursively. */
export function sourceFiles(dir: string, found: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) sourceFiles(full, found);
    else if (/\.(ts|tsx)$/.test(entry)) found.push(full);
  }
  return found;
}
