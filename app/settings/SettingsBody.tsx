"use client";

import { useMemo, useRef, useState } from "react";
import { Check, Download, Upload, RotateCcw, Trash2 } from "lucide-react";
import { usePalaceStore } from "@/lib/store";
import { useHydrated } from "@/lib/hooks/use-hydrated";
import { useRovingTabIndex } from "@/lib/hooks/use-roving-tabindex";
import { SettingsSkeleton } from "@/components/skeletons/RouteSkeletons";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Dialog } from "@/components/ui/Dialog";
import { Kbd } from "@/components/ui/Kbd";
import { ShortcutList } from "@/components/shortcuts/ShortcutList";
import { InstallApp } from "@/components/settings/InstallApp";
import { Switch } from "@/components/ui/Switch";
import { validatePalaceData } from "@/lib/storage/local-storage";
import { repairPalaceData, type RepairResult } from "@/lib/storage/repair";
import {
  ACCENTS,
  ACCENT_META,
  TEXT_SIZES,
  TEXT_SIZE_META,
  THEMES,
  THEME_META,
} from "@/lib/settings";
import { toast } from "@/lib/toast-store";

/**
 * Import ceilings. A palace larger than this cannot fit in localStorage
 * anyway, so refusing early beats freezing the tab and then failing to save.
 */
const MAX_IMPORT_BYTES = 5 * 1024 * 1024;
const MAX_ROOMS = 500;
const MAX_OBJECTS = 20_000;
const MAX_CONNECTIONS = 50_000;

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function SettingsBody() {
  const hydrated = useHydrated();
  const settings = usePalaceStore((s) => s.settings);
  const updateSettings = usePalaceStore((s) => s.updateSettings);
  const exportData = usePalaceStore((s) => s.exportData);
  const importData = usePalaceStore((s) => s.importData);
  const resetToSample = usePalaceStore((s) => s.resetToSample);
  const clearAll = usePalaceStore((s) => s.clearAll);

  const rooms = usePalaceStore((s) => s.rooms);
  const objects = usePalaceStore((s) => s.objects);
  const connections = usePalaceStore((s) => s.connections);
  const activity = usePalaceStore((s) => s.activity);

  // A radiogroup is one tab stop with arrow keys between the options, not one
  // tab stop per option. Both groups were the latter.
  const themeItem = useRovingTabIndex(
    THEMES.length,
    Math.max(0, THEMES.indexOf(settings.theme)),
    (index) => updateSettings({ theme: THEMES[index] }),
    { orientation: "horizontal" },
  );
  const accentItem = useRovingTabIndex(
    ACCENTS.length,
    Math.max(0, ACCENTS.indexOf(settings.accent)),
    (index) => updateSettings({ accent: ACCENTS[index] }),
    { orientation: "horizontal" },
  );
  const textSizeItem = useRovingTabIndex(
    TEXT_SIZES.length,
    Math.max(0, TEXT_SIZES.indexOf(settings.textSize)),
    (index) => updateSettings({ textSize: TEXT_SIZES[index] }),
    { orientation: "horizontal" },
  );

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pendingImport, setPendingImport] = useState<RepairResult | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);

  const storageSize = useMemo(() => {
    try {
      const payload = JSON.stringify({
        version: 1,
        rooms,
        objects,
        connections,
        activity,
        settings,
      });
      return formatBytes(new Blob([payload]).size);
    } catch {
      return "—";
    }
  }, [rooms, objects, connections, activity, settings]);

  const handleExport = () => {
    try {
      const data = exportData();
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const today = new Date().toISOString().slice(0, 10);
      const a = document.createElement("a");
      a.href = url;
      a.download = `memory-palace-export-${today}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast({ message: "Palace exported.", variant: "success" });
    } catch {
      toast({ message: "Export failed. Please try again.", variant: "error" });
    }
  };

  const handleFile = async (file: File) => {
    // Checked before reading: `file.text()` on a multi-hundred-megabyte file
    // pulls the whole thing into memory and freezes the tab.
    if (file.size > MAX_IMPORT_BYTES) {
      toast({
        message: `That file is ${formatBytes(file.size)}. Imports are limited to ${formatBytes(MAX_IMPORT_BYTES)}.`,
        variant: "error",
      });
      return;
    }
    if (file.type && file.type !== "application/json") {
      toast({
        message: "Choose a .json file exported from Memory Palace.",
        variant: "error",
      });
      return;
    }

    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as unknown;
      const valid = validatePalaceData(parsed);
      if (!valid) {
        toast({
          message: "That file isn't a valid Memory Palace export.",
          variant: "error",
        });
        return;
      }

      const counts = [
        ["rooms", valid.rooms.length, MAX_ROOMS],
        ["objects", valid.objects.length, MAX_OBJECTS],
        ["connections", valid.connections.length, MAX_CONNECTIONS],
      ] as const;
      const tooBig = counts.find(([, actual, cap]) => actual > cap);
      if (tooBig) {
        toast({
          message: `That palace has ${tooBig[1].toLocaleString()} ${tooBig[0]}; the limit is ${tooBig[2].toLocaleString()}.`,
          variant: "error",
        });
        return;
      }

      // Repaired rather than rejected: losing a whole palace over one bad
      // record is worse than fixing the record and saying so.
      setPendingImport(repairPalaceData(valid));
    } catch {
      toast({
        message: "Couldn't read that file — is it valid JSON?",
        variant: "error",
      });
    }
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) void handleFile(file);
    e.target.value = "";
  };

  const applyImport = () => {
    if (!pendingImport) return;
    importData(pendingImport.data);
    setPendingImport(null);
    toast({ message: "Palace imported.", variant: "success" });
  };

  if (!hydrated) return <SettingsSkeleton />;

  return (
    <>
      {/* Appearance */}
      <section className="mt-8 space-y-3">
        <h2 className="font-display text-xl tracking-wide text-text">
          Appearance
        </h2>
        <div className="divide-y divide-border-hair rounded-xl border border-border-hair bg-surface">
          {/* Theme */}
          <div className="flex flex-wrap items-center justify-between gap-4 px-5 py-4">
            <div>
              <div className="text-sm text-text">Theme</div>
              <div className="text-xs text-muted">
                {THEME_META[settings.theme].hint}.
              </div>
            </div>
            <div
              role="radiogroup"
              aria-label="Theme"
              className="flex items-center gap-1 rounded-lg border border-border-hair bg-surface-2/50 p-1"
            >
              {THEMES.map((theme) => {
                const active = settings.theme === theme;
                return (
                  <button
                    key={theme}
                    type="button"
                    role="radio"
                    {...themeItem(THEMES.indexOf(theme))}
                    aria-checked={active}
                    onClick={() => updateSettings({ theme })}
                    className={`rounded-md px-3 py-1.5 text-sm transition-colors ${
                      active
                        ? "bg-surface-2 text-text"
                        : "text-muted hover:text-text"
                    }`}
                  >
                    {THEME_META[theme].label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Accent */}
          <div className="flex flex-wrap items-center justify-between gap-4 px-5 py-4">
            <div>
              <div className="text-sm text-text">Accent</div>
              <div className="text-xs text-muted">
                The palace&rsquo;s highlight colour.
              </div>
            </div>
            <div
              role="radiogroup"
              aria-label="Accent colour"
              className="flex items-center gap-2.5"
            >
              {ACCENTS.map((key) => {
                const meta = ACCENT_META[key];
                const active = settings.accent === key;
                return (
                  <button
                    key={key}
                    type="button"
                    role="radio"
                    {...accentItem(ACCENTS.indexOf(key))}
                    aria-checked={active}
                    aria-label={meta.label}
                    title={meta.label}
                    onClick={() => updateSettings({ accent: key })}
                    className="flex h-8 w-8 items-center justify-center rounded-full transition-transform duration-150 hover:scale-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                    style={{
                      backgroundColor: meta.swatch,
                      boxShadow: active
                        ? `0 0 0 2px var(--palace-surface), 0 0 0 4px ${meta.swatch}`
                        : undefined,
                    }}
                  >
                    {active ? (
                      <Check
                        size={16}
                        strokeWidth={2.5}
                        color="var(--palace-on-accent)"
                        aria-hidden
                      />
                    ) : null}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Text size */}
          <div className="flex flex-wrap items-center justify-between gap-4 px-5 py-4">
            <div>
              <div className="text-sm text-text">Text size</div>
              <div className="text-xs text-muted">
                Scale reading size across the whole palace.
              </div>
            </div>
            <div
              role="radiogroup"
              aria-label="Text size"
              className="flex items-center gap-1 rounded-lg border border-border-hair bg-surface-2/50 p-1"
            >
              {TEXT_SIZES.map((size) => {
                const active = settings.textSize === size;
                return (
                  <button
                    key={size}
                    type="button"
                    role="radio"
                    {...textSizeItem(TEXT_SIZES.indexOf(size))}
                    aria-checked={active}
                    onClick={() => updateSettings({ textSize: size })}
                    className={`rounded-md px-3 py-1.5 text-sm transition-colors ${
                      active
                        ? "bg-surface-2 text-text"
                        : "text-muted hover:text-text"
                    }`}
                  >
                    {TEXT_SIZE_META[size].label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Reduce motion */}
          <div className="flex items-center justify-between gap-4 px-5 py-4">
            <div>
              <div className="text-sm text-text">Reduce motion</div>
              <div className="text-xs text-muted">
                Minimise animation and movement across the palace.
              </div>
            </div>
            <Switch
              label="Reduce motion"
              checked={settings.reduceMotion}
              onChange={(next) => updateSettings({ reduceMotion: next })}
            />
          </div>
        </div>
      </section>

      {/* Data */}
      <section className="mt-10 space-y-3">
        <h2 className="font-display text-xl tracking-wide text-text">
          Palace data
        </h2>

        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Rooms", value: rooms.length },
            { label: "Objects", value: objects.length },
            { label: "Connections", value: connections.length },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-xl border border-border-hair bg-surface px-4 py-3 text-center"
            >
              <div className="font-display text-2xl text-text">
                {stat.value}
              </div>
              <div className="text-xs tracking-wide text-muted">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted">
          Stored in this browser · about {storageSize} on disk.
        </p>

        <div className="flex flex-wrap gap-3 pt-1">
          <Button variant="primary" onClick={handleExport}>
            <Download size={15} strokeWidth={1.75} /> Export JSON
          </Button>
          <Button variant="ghost" onClick={() => fileInputRef.current?.click()}>
            <Upload size={15} strokeWidth={1.75} /> Import JSON
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json,.json"
            onChange={onFileChange}
            className="hidden"
            aria-hidden
          />
        </div>
      </section>

      {/* Offline */}
      <section className="mt-10 space-y-3">
        <h2 className="font-display text-xl tracking-wide text-text">
          Offline
        </h2>
        <div className="space-y-3 rounded-xl border border-border-hair bg-surface p-5">
          <p className="text-sm text-muted">
            Your palace never leaves this browser, so it works with no
            connection at all. Install it to open in its own window.
          </p>
          <InstallApp />
        </div>
      </section>

      {/* Danger zone */}
      <section className="mt-10 space-y-3">
        <h2 className="font-display text-xl tracking-wide text-text">
          Danger zone
        </h2>
        <div className="space-y-3 rounded-xl border border-border-hair bg-surface p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-sm text-text">Reset to sample palace</div>
              <div className="text-xs text-muted">
                Replace everything with the original demo data.
              </div>
            </div>
            <Button variant="ghost" onClick={() => setConfirmReset(true)}>
              <RotateCcw size={15} strokeWidth={1.75} /> Reset
            </Button>
          </div>
          <div className="h-px bg-border-hair" />
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-sm text-text">Clear everything</div>
              <div className="text-xs text-muted">
                Delete all rooms, objects, and connections.
              </div>
            </div>
            <Button variant="danger" onClick={() => setConfirmClear(true)}>
              <Trash2 size={15} strokeWidth={1.75} /> Clear all
            </Button>
          </div>
        </div>
      </section>

      {/* About */}
      <section className="mt-10 space-y-3">
        <h2 className="font-display text-xl tracking-wide text-text">About</h2>
        <div className="rounded-xl border border-border-hair bg-surface p-5">
          <p className="text-sm text-muted">
            <span className="text-text">Memory Palace</span> is a spatial home
            for everything you know — organise knowledge as rooms and objects
            inside a visual mansion. Version 1.0.
          </p>
          <div className="mt-5 border-t border-border-hair pt-5">
            <h2 className="mb-1 font-display text-lg tracking-wide text-text">
              Keyboard shortcuts
            </h2>
            <p className="mb-4 text-xs text-muted">
              Press <Kbd>?</Kbd> anywhere to bring this list up as a card.
            </p>
            <ShortcutList />
          </div>
        </div>
      </section>

      {/* Import confirmation */}
      <Dialog
        open={pendingImport !== null}
        onClose={() => setPendingImport(null)}
        title="Import this palace?"
        description="This will replace your current palace with the imported data."
        footer={
          <>
            <Button variant="ghost" onClick={() => setPendingImport(null)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={applyImport}>
              Replace &amp; import
            </Button>
          </>
        }
      >
        {pendingImport ? (
          <>
            <p className="text-sm text-muted">
              The file contains{" "}
              <span className="text-text">
                {pendingImport.data.rooms.length} rooms
              </span>
              ,{" "}
              <span className="text-text">
                {pendingImport.data.objects.length} objects
              </span>
              , and{" "}
              <span className="text-text">
                {pendingImport.data.connections.length} connections
              </span>
              .
            </p>

            {/* Everything that had to change is listed before the user
                commits, rather than applied silently or used as grounds to
                reject the whole file. */}
            {pendingImport.repairs.length > 0 ? (
              <div className="mt-4 rounded-lg border border-border-hair bg-surface-2/60 p-3">
                <p className="text-xs tracking-wide text-text">
                  {pendingImport.repairs.length}{" "}
                  {pendingImport.repairs.length === 1 ? "thing" : "things"} will
                  be repaired on import:
                </p>
                <ul className="mt-2 max-h-40 space-y-1 overflow-y-auto text-xs text-muted">
                  {pendingImport.repairs.slice(0, 20).map((repair, index) => (
                    <li key={index} className="flex gap-2">
                      <span aria-hidden>·</span>
                      <span>{repair.detail}</span>
                    </li>
                  ))}
                  {pendingImport.repairs.length > 20 ? (
                    <li className="text-muted">
                      …and {pendingImport.repairs.length - 20} more.
                    </li>
                  ) : null}
                </ul>
              </div>
            ) : null}
          </>
        ) : null}
      </Dialog>

      <ConfirmDialog
        open={confirmReset}
        onClose={() => setConfirmReset(false)}
        onConfirm={() => {
          resetToSample();
          toast({ message: "Reset to the sample palace." });
        }}
        title="Reset to sample palace?"
        confirmLabel="Reset"
        note="Your current rooms and objects will be replaced with the demo data. This cannot be undone."
      />

      <ConfirmDialog
        open={confirmClear}
        onClose={() => setConfirmClear(false)}
        onConfirm={() => {
          clearAll();
          toast({ message: "Palace cleared." });
        }}
        title="Clear everything?"
        confirmLabel="Clear all"
        danger
        note="Every room, object, and connection will be permanently deleted. This cannot be undone."
      />
    </>
  );
}
