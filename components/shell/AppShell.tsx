import { SidebarContent } from "@/components/shell/SidebarContent";
import { MobileDrawer } from "@/components/shell/MobileDrawer";
import { CommandTrigger } from "@/components/shell/CommandTrigger";
import { SaveIndicator } from "@/components/shell/SaveIndicator";
import { ObjectEditor } from "@/components/editor/ObjectEditor";
import { CommandPalette } from "@/components/command/CommandPalette";
import { Toaster } from "@/components/ui/Toaster";
import { FirstRun } from "@/components/onboarding/FirstRun";
import { HydrationGate } from "@/components/providers/HydrationGate";
import { UndoShortcuts } from "@/components/providers/UndoShortcuts";
import { ShortcutsDialog } from "@/components/shortcuts/ShortcutsDialog";
import { ServiceWorkerManager } from "@/components/providers/ServiceWorkerManager";

/**
 * The application chrome.
 *
 * A Server Component: the landmarks, layout and static copy are in the HTML
 * before any JavaScript runs. Only the parts that genuinely need the client —
 * the active nav link, the drawer, the palette trigger, the save state — are
 * islands inside it.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-base text-text">
      <a
        href="#main"
        className="sr-only rounded-lg bg-accent px-4 py-2 text-sm font-medium text-on-accent focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-50"
      >
        Skip to content
      </a>

      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-border-hair bg-surface/60 lg:flex">
        <SidebarContent />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-10 flex h-16 items-center gap-3 border-b border-border-hair bg-base/80 px-4 backdrop-blur sm:px-6">
          <MobileDrawer />
          <CommandTrigger />
          <SaveIndicator />
        </header>

        <main id="main" className="min-w-0 flex-1">
          <HydrationGate>{children}</HydrationGate>
        </main>
      </div>

      {/* Global behaviour and overlays */}
      <UndoShortcuts />
      <ServiceWorkerManager />
      <ShortcutsDialog />
      <FirstRun />
      <ObjectEditor />
      <CommandPalette />
      <Toaster />
    </div>
  );
}
