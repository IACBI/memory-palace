"use client";

import { useMemo, useRef, useState } from "react";
import { Check, Download, Upload, RotateCcw, Trash2 } from "lucide-react";
import { usePalaceStore } from "@/lib/store";
import { PageHeader } from "@/components/shell/PageHeader";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Dialog } from "@/components/ui/Dialog";
import { Kbd } from "@/components/ui/Kbd";
import { Switch } from "@/components/ui/Switch";
import { validatePalaceData } from "@/lib/storage/local-storage";
import {
  ACCENTS,
  ACCENT_META,
  TEXT_SIZES,
  TEXT_SIZE_META,
} from "@/lib/settings";
import { toast } from "@/lib/toast-store";
import type { PalaceData } from "@/lib/types";

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const SHORTCUTS: { keys: string[]; label: string }[] = [
  { keys: ["Ctrl", "K"], label: "Open the command palette / search" },
  { keys: ["Esc"], label: "Close a dialog, panel, or the palette" },
  { keys: ["Enter"], label: "Open the focused object" },
  { keys: ["←", "→", "↑", "↓"], label: "Move a focused object (hold Shift for larger steps)" },
  { keys: ["Delete"], label: "Delete a focused object" },
];

export default function SettingsPage() {
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

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pendingImport, setPendingImport] = useState<PalaceData | null>(null);
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
      setPendingImport(valid);
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
    importData(pendingImport);
    setPendingImport(null);
    toast({ message: "Palace imported.", variant: "success" });
  };

  return (
    <div className="mx-auto max-w-3xl px-5 py-10 sm:px-8">
      <PageHeader
        title="Settings"
        subtitle="Preferences, your palace data, and a few things worth knowing."
      />

      {/* Appearance */}
      <section className="mt-8 space-y-3">
        <h2 className="font-display text-xl tracking-wide text-text">Appearance</h2>
        <div className="divide-y divide-border-hair rounded-xl border border-border-hair bg-surface">
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
                        color="#1a1410"
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
        <h2 className="font-display text-xl tracking-wide text-text">Palace data</h2>

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
              <div className="font-display text-2xl text-text">{stat.value}</div>
              <div className="text-xs tracking-wide text-muted">{stat.label}</div>
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

      {/* Danger zone */}
      <section className="mt-10 space-y-3">
        <h2 className="font-display text-xl tracking-wide text-text">Danger zone</h2>
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
            <span className="text-text">Memory Palace</span> is a spatial home for
            everything you know — organise knowledge as rooms and objects inside a
            visual mansion. Version 1.0.
          </p>
          <div className="mt-4">
            <h3 className="mb-2 text-xs tracking-widest text-muted uppercase">
              Keyboard shortcuts
            </h3>
            <ul className="space-y-2">
              {SHORTCUTS.map((s) => (
                <li
                  key={s.label}
                  className="flex items-center justify-between gap-4 text-sm"
                >
                  <span className="text-muted">{s.label}</span>
                  <span className="flex shrink-0 items-center gap-1">
                    {s.keys.map((k) => (
                      <Kbd key={k}>{k}</Kbd>
                    ))}
                  </span>
                </li>
              ))}
            </ul>
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
          <p className="text-sm text-muted">
            The file contains{" "}
            <span className="text-text">{pendingImport.rooms.length} rooms</span>,{" "}
            <span className="text-text">
              {pendingImport.objects.length} objects
            </span>
            , and{" "}
            <span className="text-text">
              {pendingImport.connections.length} connections
            </span>
            .
          </p>
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
    </div>
  );
}
