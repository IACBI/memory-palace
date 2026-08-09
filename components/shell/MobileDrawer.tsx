"use client";

import { useState } from "react";
import { Menu as MenuIcon } from "lucide-react";
import { SidebarContent } from "@/components/shell/SidebarContent";
import { IconButton } from "@/components/ui/IconButton";
import { useFocusTrap } from "@/lib/hooks/use-focus-trap";
import { useDismissable } from "@/lib/hooks/use-dismissable";

/**
 * The navigation drawer below the `md` breakpoint, where there is no room for
 * even the icon rail.
 *
 * Claims `aria-modal`, so it has to behave like one: Escape closes it, Tab
 * cycles inside it, and focus returns to the trigger on close. It previously
 * did none of those, leaving keyboard users tabbed out into the page behind an
 * overlay they could not dismiss.
 *
 * Its `SidebarContent` is only rendered while open, which also keeps exactly
 * one `<nav aria-label="Main">` in the document at a time.
 */
export function MobileDrawer() {
  const [open, setOpen] = useState(false);
  const panelRef = useFocusTrap<HTMLElement>(open);
  useDismissable(open, () => setOpen(false));

  return (
    <>
      <IconButton
        label="Open navigation"
        variant="ghost"
        aria-expanded={open}
        onClick={() => setOpen(true)}
        className="md:hidden"
      >
        <MenuIcon size={18} strokeWidth={1.75} aria-hidden />
      </IconButton>

      {open ? (
        <div className="fixed inset-0 z-[var(--z-overlay)] md:hidden">
          <button
            type="button"
            aria-label="Close navigation"
            tabIndex={-1}
            onClick={() => setOpen(false)}
            className="motion-fade-in absolute inset-0 h-full w-full cursor-default bg-black/60 backdrop-blur-sm"
          />
          <aside
            ref={panelRef}
            className="motion-dialog-in relative flex h-full w-72 max-w-[85vw] flex-col border-r border-border-strong bg-surface"
            role="dialog"
            aria-modal="true"
            aria-label="Navigation"
          >
            <SidebarContent onNavigate={() => setOpen(false)} />
          </aside>
        </div>
      ) : null}
    </>
  );
}
