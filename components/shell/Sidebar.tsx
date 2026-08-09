"use client";

import { useCallback, useSyncExternalStore } from "react";
import { SidebarContent } from "@/components/shell/SidebarContent";
import { cn } from "@/lib/cn";

/**
 * The desktop sidebar, and the only thing that knows whether it is collapsed.
 *
 * A client island rather than state in `AppShell`, which stays a Server
 * Component so every route's static HTML still contains the real navigation.
 * It renders the `<aside>` itself and adds no wrapper around it:
 * `e2e/responsive.spec.ts` locates the sidebar as `body > div > aside` and
 * measures it, so an extra element here would break that at both widths.
 *
 * Three widths, not two. Below `md` this is not rendered at all and the drawer
 * takes over; from `md` it is the 64px icon rail; from `lg` it is the full
 * 256px sidebar *unless* the reader has collapsed it, which returns it to the
 * same 64px rail. Collapsing therefore reuses a layout the app already had
 * rather than inventing a third one.
 */
const NAV_KEY = "memory-palace-nav:v1";

/** Notified on our own writes; `storage` only fires in *other* tabs. */
const listeners = new Set<() => void>();

function subscribe(onChange: () => void): () => void {
  listeners.add(onChange);
  window.addEventListener("storage", onChange);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener("storage", onChange);
  };
}

function isCollapsed(): boolean {
  try {
    return window.localStorage.getItem(NAV_KEY) === "collapsed";
  } catch {
    // Private mode: the preference simply does not persist.
    return false;
  }
}

function writeCollapsed(next: boolean): void {
  try {
    window.localStorage.setItem(NAV_KEY, next ? "collapsed" : "expanded");
  } catch {
    // Not persisting is survivable; refusing to collapse is not.
  }
  for (const listener of listeners) listener();
}

export function Sidebar() {
  /**
   * `useSyncExternalStore` rather than state seeded in an effect: the third
   * argument is the server snapshot, so the markup React hydrates against is
   * always the expanded default and the stored preference is applied in the
   * same pass — no mismatch, and no `setState` inside an effect.
   */
  const collapsed = useSyncExternalStore(subscribe, isCollapsed, () => false);

  const toggle = useCallback(() => writeCollapsed(!isCollapsed()), []);

  return (
    <aside
      data-shell-chrome
      className={cn(
        "sticky top-0 z-[var(--z-raised)] hidden h-screen w-16 shrink-0 flex-col border-r border-border-hair bg-surface/40 backdrop-blur-sm md:flex",
        collapsed ? "lg:w-16" : "lg:w-64",
      )}
    >
      {/* The width deliberately does not transition. A reader who collapsed the
          sidebar gets their preference applied just after hydration, and an
          animated width would turn that into the whole chrome sliding shut on
          every single page load. Snapping is the quieter of the two. */}
      <SidebarContent rail collapsed={collapsed} onToggleCollapsed={toggle} />
    </aside>
  );
}
