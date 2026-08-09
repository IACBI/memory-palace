"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { isActiveHref, NAV_ITEMS } from "@/components/shell/nav-items";
import { Kbd } from "@/components/ui/Kbd";
import { useShortcutsStore } from "@/lib/shortcuts-store";
import { cn } from "@/lib/cn";

/**
 * Brand, navigation and tagline — the floor directory. A client island only
 * because the active link depends on `usePathname()`.
 *
 * Renders at rail width and full width. Labels collapse to `sr-only` on the
 * rail — deliberately *not* `hidden`, which would take the label out of the
 * accessibility tree and leave each link named by nothing at all, since the
 * icons are decorative.
 *
 * Which widths count as "the rail" depends on `collapsed`. Left alone the
 * aside is a rail between `md` and `lg` only, so the labels hide with
 * `max-lg:`; collapsed by the reader it is a rail at every width, so the same
 * rules apply unconditionally. Both spellings of each rule are kept in the
 * three constants below rather than repeated down the file. `rail` is false
 * inside the mobile drawer, which is always full width and never collapsed.
 */
export function SidebarContent({
  onNavigate,
  rail = false,
  collapsed = false,
  onToggleCollapsed,
}: {
  onNavigate?: () => void;
  rail?: boolean;
  collapsed?: boolean;
  onToggleCollapsed?: () => void;
}) {
  const pathname = usePathname();

  /** Labels: present for screen readers, invisible on the rail. */
  const collapse = rail
    ? collapsed
      ? "sr-only"
      : "max-lg:sr-only"
    : undefined;
  /** Rows: centred on their icon once there is no label beside it. */
  const centreOnRail = rail
    ? collapsed
      ? "justify-center px-0"
      : "max-lg:justify-center max-lg:px-0"
    : undefined;
  /** Decoration with nothing to say: gone on the rail rather than hidden. */
  const dropOnRail = rail
    ? collapsed
      ? "hidden"
      : "max-lg:hidden"
    : undefined;

  return (
    <>
      <div
        className={cn(
          "flex items-center gap-2 pt-6 pb-6",
          rail
            ? collapsed
              ? "justify-center px-2"
              : "px-3 max-lg:justify-center lg:px-6"
            : "px-6",
        )}
      >
        <Link
          href="/"
          className={cn("min-w-0", collapse)}
          onClick={onNavigate}
          aria-label="Memory Palace — dashboard"
        >
          {/* The wordmark carries the brand on its own now. `lamp-sweep` walks
              a pool of the accent colour across it every few seconds — the
              same light the rest of the chrome is lit by, made to move once. */}
          <span className="lamp-sweep inline-block">
            <span className="block font-display text-lg leading-none font-bold tracking-tight text-text">
              Memory
            </span>
            <span className="mt-1 block font-display text-lg leading-none font-bold tracking-tight text-accent">
              Palace
            </span>
          </span>
        </Link>

        {rail && onToggleCollapsed ? (
          <button
            type="button"
            onClick={onToggleCollapsed}
            aria-label={collapsed ? "Expand navigation" : "Collapse navigation"}
            aria-expanded={!collapsed}
            className={cn(
              "flex h-11 w-11 shrink-0 items-center justify-center rounded-md text-muted transition-quiet hover:bg-surface-2/40 hover:text-text",
              // Only the full sidebar has room for the wordmark beside it, so
              // only there does the button need pushing to the far end. At
              // rail widths it is the whole row, and it still answers: the
              // preference it sets is what the sidebar opens to at `lg`.
              collapsed ? "" : "lg:ml-auto",
            )}
          >
            {collapsed ? (
              <PanelLeftOpen size={18} strokeWidth={1.75} aria-hidden />
            ) : (
              <PanelLeftClose size={18} strokeWidth={1.75} aria-hidden />
            )}
          </button>
        ) : null}
      </div>

      <nav
        className={cn(
          "flex flex-1 flex-col gap-0.5",
          rail ? "px-2 lg:px-3" : "px-3",
        )}
        aria-label="Main"
      >
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = isActiveHref(pathname, href);
          return (
            <Link
              key={href}
              href={href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={cn(
                "group relative flex h-11 items-center gap-3 rounded-md pr-3 pl-4 text-sm transition-quiet",
                centreOnRail,
                active
                  ? "bg-surface-2/70 text-text"
                  : "text-muted hover:bg-surface-2/40 hover:text-text",
              )}
            >
              {/* The jamb: a full-height bar of light on the section you are
                  standing in, a hairline on the ones you are not. */}
              <span
                className={cn(
                  "absolute inset-y-1.5 left-0 w-0.5 rounded-full transition-quiet",
                  dropOnRail,
                  active
                    ? "bg-accent"
                    : "bg-transparent group-hover:bg-border-strong",
                )}
                aria-hidden
              />
              <Icon
                className={cn(
                  "shrink-0 transition-quiet",
                  active ? "text-accent" : "text-muted group-hover:text-text",
                )}
                size={18}
                strokeWidth={1.75}
                aria-hidden
              />
              <span className={cn("truncate", collapse)}>{label}</span>
            </Link>
          );
        })}
      </nav>

      <div className={cn("pt-4 pb-2", rail ? "px-2 lg:px-3" : "px-3")}>
        <button
          type="button"
          onClick={() => {
            // Inside the mobile drawer, leaving it open behind the sheet would
            // stack two overlays for one action.
            onNavigate?.();
            useShortcutsStore.getState().setShortcutsOpen(true);
          }}
          className={cn(
            "flex h-11 w-full items-center justify-between gap-3 rounded-md px-3 text-sm text-muted transition-quiet hover:bg-surface-2/40 hover:text-text",
            centreOnRail,
          )}
        >
          <span className={cn("truncate", collapse)}>Keyboard shortcuts</span>
          <Kbd>?</Kbd>
        </button>
      </div>

      <div
        className={cn(
          "px-6 pt-1 pb-6 text-xs text-balance text-muted",
          dropOnRail,
        )}
      >
        A home for everything you know.
      </div>
    </>
  );
}
