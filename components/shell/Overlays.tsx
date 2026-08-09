"use client";

import { useEffect } from "react";
import dynamic from "next/dynamic";
import { usePalaceStore } from "@/lib/store";
import { useShortcutsStore } from "@/lib/shortcuts-store";
import { isEditingText, isHelpKey } from "@/lib/shortcuts";
import { Toaster } from "@/components/ui/Toaster";
import { FirstRun } from "@/components/onboarding/FirstRun";
import { UndoShortcuts } from "@/components/providers/UndoShortcuts";
import { ServiceWorkerManager } from "@/components/providers/ServiceWorkerManager";

/**
 * The three heavy overlays, fetched the first time they are actually opened.
 *
 * The shell mounts these on *every* route, so before this split the command
 * palette, the object editor and the shortcut sheet were part of the first
 * load of the dashboard — roughly a thousand lines, plus the search index and
 * the whole shortcut table, for a reader who had not yet pressed anything.
 *
 * Route-level splitting could not help: they are chrome, not a route. What
 * makes the split safe is that the *listeners* stay here, in code that is
 * always loaded, so Ctrl+K and `?` still work on the very first press — they
 * flip a store flag, and the chunk arrives behind it.
 */
const CommandPalette = dynamic(
  () =>
    import("@/components/command/CommandPalette").then((m) => m.CommandPalette),
  { ssr: false },
);

const ObjectEditor = dynamic(
  () => import("@/components/editor/ObjectEditor").then((m) => m.ObjectEditor),
  { ssr: false },
);

const ShortcutsDialog = dynamic(
  () =>
    import("@/components/shortcuts/ShortcutsDialog").then(
      (m) => m.ShortcutsDialog,
    ),
  { ssr: false },
);

/**
 * Global behaviour and overlays, mounted once by `AppShell`.
 *
 * A client island so `AppShell` itself can stay a Server Component: every
 * route's static HTML keeps containing the real interface.
 */
export function Overlays() {
  const paletteOpen = usePalaceStore((s) => s.commandPaletteOpen);
  const setPaletteOpen = usePalaceStore((s) => s.setCommandPaletteOpen);
  const activeObjectId = usePalaceStore((s) => s.activeObjectId);
  const shortcutsOpen = useShortcutsStore((s) => s.open);

  /**
   * Warms the three lazy chunks once the page has gone quiet.
   *
   * Splitting them keeps them out of the first load — they are not referenced
   * by the document, so nothing blocks first paint on them. But it also put a
   * network fetch between the first `?` press and the sheet appearing, which
   * `shortcuts.spec.ts` caught on the slower static server. Fetching on idle
   * gets both: the critical path stays small, and by the time anyone presses
   * anything the module is already in the cache and the overlay opens
   * synchronously.
   *
   * `import()` is memoised by the module registry, so this is the same promise
   * `next/dynamic` awaits — warming it here makes the later render instant
   * rather than duplicating any work.
   */
  useEffect(() => {
    const warm = () => {
      void import("@/components/command/CommandPalette");
      void import("@/components/editor/ObjectEditor");
      void import("@/components/shortcuts/ShortcutsDialog");
    };

    if (typeof window.requestIdleCallback === "function") {
      const handle = window.requestIdleCallback(warm, { timeout: 2000 });
      return () => window.cancelIdleCallback?.(handle);
    }
    const timer = setTimeout(warm, 1200);
    return () => clearTimeout(timer);
  }, []);

  // Ctrl/Cmd+K toggles the palette.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setPaletteOpen(!usePalaceStore.getState().commandPaletteOpen);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setPaletteOpen]);

  // `?` toggles the cheatsheet, unless the reader is typing one.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (!isHelpKey(event) || isEditingText(event.target)) return;
      event.preventDefault();
      useShortcutsStore.getState().toggleShortcuts();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      <UndoShortcuts />
      <ServiceWorkerManager />
      {/* Not split: this is the first thing a new visitor sees, so it has no
          interaction to hide a fetch behind. */}
      <FirstRun />
      {shortcutsOpen ? <ShortcutsDialog /> : null}
      {activeObjectId ? <ObjectEditor /> : null}
      {paletteOpen ? <CommandPalette /> : null}
      <Toaster />
    </>
  );
}
