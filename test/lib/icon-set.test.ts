import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { REPO_ROOT, stripComments } from "../helpers";
import {
  FALLBACK_ROOM_ICON,
  isRoomIconName,
  ROOM_ICONS,
  ROOM_ICON_CHOICES,
} from "@/lib/icon-set";
import { createSeedData } from "@/lib/seed-data";

const ROOT = REPO_ROOT;

/** Lucide icons are `forwardRef` objects, not plain function components. */
const isRenderable = (value: unknown) =>
  typeof value === "function" ||
  (typeof value === "object" && value !== null && "$$typeof" in value);

describe("room icon set", () => {
  it("has a component for every offered choice", () => {
    for (const name of ROOM_ICON_CHOICES) {
      expect(isRenderable(ROOM_ICONS[name])).toBe(true);
    }
  });

  it("includes the fallback icon", () => {
    expect(isRenderable(ROOM_ICONS[FALLBACK_ROOM_ICON])).toBe(true);
  });

  it("covers every icon the seed palace uses", () => {
    for (const room of createSeedData().rooms) {
      expect(isRoomIconName(room.icon)).toBe(true);
    }
  });

  it("rejects unknown and non-string names", () => {
    expect(isRoomIconName("Biohazard")).toBe(false);
    expect(isRoomIconName("")).toBe(false);
    expect(isRoomIconName(null)).toBe(false);
    expect(isRoomIconName(42)).toBe(false);
  });

  it("is not tricked by inherited object properties", () => {
    // `"constructor" in ROOM_ICONS` is true via the prototype chain, which
    // would resolve to a non-component and crash the renderer.
    expect(isRoomIconName("constructor")).toBe(false);
    expect(isRoomIconName("toString")).toBe(false);
  });
});

describe("bundle discipline", () => {
  /**
   * `import { icons }` pulls in ~2,000 components that no bundler can
   * tree-shake. It previously accounted for 155 KB gzipped on every route.
   */
  it("never namespace-imports the lucide icon registry", () => {
    for (const file of [
      join(ROOT, "components", "RoomIcon.tsx"),
      join(ROOT, "lib", "icon-set.ts"),
    ]) {
      const source = stripComments(readFileSync(file, "utf8"));
      expect(source).not.toMatch(/import\s+\{[^}]*\bicons\b[^}]*\}\s+from/);
      expect(source).not.toMatch(/import\s+\*\s+as\s+\w+\s+from\s+["']lucide/);
    }
  });
});
