"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Castle,
  Library,
  Share2,
  Settings,
  Search,
  Menu,
  type LucideIcon,
} from "lucide-react";
import { usePalaceStore } from "@/lib/store";
import { ObjectEditor } from "@/components/editor/ObjectEditor";
import { Toaster } from "@/components/ui/Toaster";
import { CommandPalette } from "@/components/command/CommandPalette";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

const NAV: NavItem[] = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/palace", label: "Palace", icon: Castle },
  { href: "/library", label: "Library", icon: Library },
  { href: "/graph", label: "Graph", icon: Share2 },
  { href: "/settings", label: "Settings", icon: Settings },
];

function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function SidebarContent({
  pathname,
  onNavigate,
}: {
  pathname: string;
  onNavigate?: () => void;
}) {
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

      <nav className="flex flex-1 flex-col gap-1 px-3">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = isActive(pathname, href);
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
                className={active ? "text-accent" : "text-muted group-hover:text-text"}
                size={18}
                strokeWidth={1.75}
              />
              <span className="tracking-wide">{label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="px-6 py-5 font-display text-sm tracking-wide text-muted">
        A home for everything you know.
      </div>
    </>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const setCommandPaletteOpen = usePalaceStore(
    (state) => state.setCommandPaletteOpen,
  );
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-base text-text">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-border-hair bg-surface/60 lg:flex">
        <SidebarContent pathname={pathname} />
      </aside>

      {/* Mobile drawer */}
      {drawerOpen ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setDrawerOpen(false)}
            aria-hidden
          />
          <aside
            className="animate-[dialogIn_180ms_ease-out] relative flex h-full w-64 flex-col border-r border-border-strong bg-surface"
            role="dialog"
            aria-modal="true"
            aria-label="Navigation"
          >
            <SidebarContent
              pathname={pathname}
              onNavigate={() => setDrawerOpen(false)}
            />
          </aside>
        </div>
      ) : null}

      {/* Main column */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top bar */}
        <header className="sticky top-0 z-10 flex h-16 items-center gap-3 border-b border-border-hair bg-base/80 px-4 backdrop-blur sm:px-6">
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            aria-label="Open navigation"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border-hair text-muted transition-colors hover:border-border-strong hover:text-text lg:hidden"
          >
            <Menu size={18} strokeWidth={1.75} />
          </button>
          <button
            type="button"
            onClick={() => setCommandPaletteOpen(true)}
            className="group flex w-full max-w-md items-center gap-3 rounded-lg border border-border-hair bg-surface px-3.5 py-2 text-left text-sm text-muted transition-colors hover:border-border-strong hover:text-text"
          >
            <Search size={16} strokeWidth={1.75} className="shrink-0" />
            <span className="flex-1 truncate">Search the palace…</span>
            <kbd className="hidden rounded border border-border-strong bg-surface-2 px-1.5 py-0.5 font-sans text-[10px] tracking-widest text-muted sm:inline">
              Ctrl K
            </kbd>
          </button>
        </header>

        <main className="min-w-0 flex-1">{children}</main>
      </div>

      {/* Global overlays */}
      <ObjectEditor />
      <CommandPalette />
      <Toaster />
    </div>
  );
}
