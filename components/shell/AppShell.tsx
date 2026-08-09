import { Sidebar } from "@/components/shell/Sidebar";
import { MobileDrawer } from "@/components/shell/MobileDrawer";
import { CommandTrigger } from "@/components/shell/CommandTrigger";
import { SaveIndicator } from "@/components/shell/SaveIndicator";
import { Overlays } from "@/components/shell/Overlays";
import { HydrationGate } from "@/components/providers/HydrationGate";

/**
 * The application chrome.
 *
 * A Server Component: the landmarks, layout and static copy are in the HTML
 * before any JavaScript runs. Only the parts that genuinely need the client —
 * the active nav link, the drawer, the palette trigger, the save state — are
 * islands inside it. `e2e/onboarding.spec.ts` loads a route with JavaScript
 * disabled and asserts the real interface is there, which is what keeps this
 * from quietly regressing into a spinner.
 *
 * Navigation has three tiers: a drawer below `md`, a 64px icon rail from `md`,
 * and the full sidebar from `lg` — which the reader can collapse back to the
 * rail. `Sidebar` owns that state and renders the `<aside>` itself, with no
 * wrapper around it: `e2e/responsive.spec.ts` locates the sidebar as
 * `body > div > aside` and measures it at exactly 64 and 256, so the aside has
 * to stay a direct child of this root element at those two widths.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen bg-ground text-text">
      {/*
        The one light in the room, made literal: a single warm pool at the top
        of the viewport that everything else is lit by. Fixed and painted once
        — it does not animate, scroll or repaint, so it costs a composited
        layer and nothing else.
      */}
      <div
        className="pointer-events-none fixed inset-x-0 top-0 h-[38rem] bg-[radial-gradient(70%_100%_at_50%_0%,var(--palace-accent-glow),transparent_70%)] opacity-[0.07]"
        aria-hidden
      />

      <a
        href="#main"
        className="sr-only rounded-md bg-accent px-4 py-2 text-sm font-medium text-on-accent focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-[var(--z-toast)]"
      >
        Skip to content
      </a>

      <Sidebar />

      <div className="relative flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-[var(--z-sticky)] flex h-16 items-center gap-3 bg-ground/70 px-3 backdrop-blur-md sm:px-6">
          <MobileDrawer />
          <CommandTrigger />
          <SaveIndicator />
          {/* A lit edge rather than a border: the rule fades out as it travels
              away from the light, which is the same gradient `PageHeader`
              uses under every page title. */}
          <span
            className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-border-strong via-border-hair to-transparent"
            aria-hidden
          />
        </header>

        <main id="main" className="min-w-0 flex-1">
          <HydrationGate>{children}</HydrationGate>
        </main>
      </div>

      <Overlays />
    </div>
  );
}
