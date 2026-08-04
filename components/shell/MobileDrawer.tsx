"use client";

import { useState } from "react";
import { Menu } from "lucide-react";
import { SidebarContent } from "@/components/shell/SidebarContent";
import { useFocusTrap } from "@/lib/hooks/use-focus-trap";
import { useDismissable } from "@/lib/hooks/use-dismissable";

/**
 * The navigation drawer below the `lg` breakpoint.
 *
 * Claims `aria-modal`, so it has to behave like one: Escape closes it, Tab
 * cycles inside it, and focus returns to the trigger on close. It previously
 * did none of those, leaving keyboard users tabbed out into the page behind an
 * overlay they could not dismiss.
 */
export function MobileDrawer() {
  const [open, setOpen] = useState(false);
  const panelRef = useFocusTrap<HTMLElement>(open);
  useDismissable(open, () => setOpen(false));

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open navigation"
        aria-expanded={open}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border-hair text-muted transition-colors hover:border-border-strong hover:text-text lg:hidden"
      >
        <Menu size={18} strokeWidth={1.75} />
      </button>

      {open ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            type="button"
            aria-label="Close navigation"
            tabIndex={-1}
            onClick={() => setOpen(false)}
            className="motion-fade-in absolute inset-0 h-full w-full cursor-default bg-black/60 backdrop-blur-sm"
          />
          <aside
            ref={panelRef}
            className="motion-dialog-in relative flex h-full w-64 flex-col border-r border-border-strong bg-surface"
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
