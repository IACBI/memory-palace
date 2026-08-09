"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { MoreVertical, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";
import { useDismissable } from "@/lib/hooks/use-dismissable";
import { useRovingTabIndex } from "@/lib/hooks/use-roving-tabindex";

export interface MenuItem {
  label: string;
  icon?: LucideIcon;
  onSelect: () => void;
  /** Renders the item in the destructive colour. */
  danger?: boolean;
}

/**
 * A trigger and its dropdown, following the ARIA menu button pattern.
 *
 * This was hand-built inside `RoomChamber` and nowhere else, so every one of
 * its careful details — Escape through the shared overlay stack, `pointerdown`
 * to dismiss so touch and pen work, focus returning to the trigger on close,
 * arrow keys via `useRovingTabIndex` — had to be reproduced by hand at the next
 * call site. It lives here now.
 */
export function Menu({
  label,
  items,
  align = "right",
  triggerClassName,
}: {
  /** Accessible name for the trigger, e.g. "Actions for The Study". */
  label: string;
  items: MenuItem[];
  align?: "left" | "right";
  triggerClassName?: string;
}) {
  const [open, setOpen] = useState(false);
  const [activeItem, setActiveItem] = useState(0);
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const close = useCallback(() => {
    setOpen(false);
    triggerRef.current?.focus();
  }, []);

  useDismissable(open, close);

  useEffect(() => {
    if (!open) return;
    const onDown = (event: Event) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    // `pointerdown` covers mouse, touch and pen alike.
    window.addEventListener("pointerdown", onDown);
    return () => window.removeEventListener("pointerdown", onDown);
  }, [open]);

  // Focus follows the menu open, so the keyboard lands where the eye does.
  useEffect(() => {
    if (!open) return;
    menuRef.current?.querySelector<HTMLElement>('[role="menuitem"]')?.focus();
  }, [open]);

  const itemProps = useRovingTabIndex(items.length, activeItem, setActiveItem, {
    orientation: "vertical",
  });

  return (
    <div ref={menuRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => {
          setActiveItem(0);
          setOpen((value) => !value);
        }}
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        className={cn(
          "hit-area flex h-8 w-8 items-center justify-center rounded-md text-muted transition-quiet hover:bg-surface-2 hover:text-text focus-visible:opacity-100",
          triggerClassName,
        )}
      >
        <MoreVertical size={16} strokeWidth={1.75} aria-hidden />
      </button>
      {open ? (
        <div
          role="menu"
          className={cn(
            "motion-menu-in absolute top-9 z-[var(--z-drawer)] w-40 overflow-hidden rounded-md border border-border-strong bg-surface shadow-overlay",
            align === "right" ? "right-0" : "left-0",
          )}
        >
          {items.map((item, index) => (
            <button
              key={item.label}
              type="button"
              role="menuitem"
              {...itemProps(index)}
              onClick={() => {
                setOpen(false);
                item.onSelect();
              }}
              className={cn(
                "flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm transition-quiet hover:bg-surface-2 focus-visible:bg-surface-2",
                item.danger ? "text-danger" : "text-text",
              )}
            >
              {item.icon ? (
                <item.icon size={14} strokeWidth={1.75} aria-hidden />
              ) : null}
              {item.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
