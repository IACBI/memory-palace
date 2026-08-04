"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { isActiveHref, NAV_ITEMS } from "@/components/shell/nav-items";
import { Kbd } from "@/components/ui/Kbd";
import { useShortcutsStore } from "@/lib/shortcuts-store";

/**
 * Brand, navigation and tagline. A client island only because the active link
 * depends on `usePathname()`.
 */
export function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <>
      <div className="px-6 pt-7 pb-6">
        <Link href="/" className="block" onClick={onNavigate}>
          <span className="block font-display text-2xl leading-tight font-semibold tracking-wide text-text">
            Memory
          </span>
          <span className="block font-display text-2xl leading-tight font-semibold tracking-wide text-accent">
            Palace
          </span>
        </Link>
      </div>

      <div className="mx-4 mb-4 h-px bg-border-hair" />

      <nav className="flex flex-1 flex-col gap-1 px-3" aria-label="Main">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = isActiveHref(pathname, href);
          return (
            <Link
              key={href}
              href={href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={[
                "group flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                active
                  ? "bg-surface-2 text-text"
                  : "text-muted hover:bg-surface-2/60 hover:text-text",
              ].join(" ")}
            >
              <span
                className={[
                  "flex h-6 w-1 shrink-0 rounded-full transition-colors",
                  active ? "bg-accent" : "bg-transparent",
                ].join(" ")}
                aria-hidden
              />
              <Icon
                className={
                  active ? "text-accent" : "text-muted group-hover:text-text"
                }
                size={18}
                strokeWidth={1.75}
              />
              <span className="tracking-wide">{label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="px-3 pt-4 pb-2">
        <button
          type="button"
          onClick={() => {
            // Inside the mobile drawer, leaving it open behind the sheet would
            // stack two overlays for one action.
            onNavigate?.();
            useShortcutsStore.getState().setShortcutsOpen(true);
          }}
          className="flex w-full items-center justify-between gap-3 rounded-md px-3 py-2 text-sm text-muted transition-colors hover:bg-surface-2/60 hover:text-text"
        >
          <span className="tracking-wide">Keyboard shortcuts</span>
          <Kbd>?</Kbd>
        </button>
      </div>

      <div className="px-6 pt-1 pb-5 font-display text-sm tracking-wide text-muted">
        A home for everything you know.
      </div>
    </>
  );
}
