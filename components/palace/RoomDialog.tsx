"use client";

import { useState } from "react";
import { Dialog } from "@/components/ui/Dialog";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { RoomIcon } from "@/components/RoomIcon";
import { ROOM_ICON_CHOICES, PALETTE_CHOICES } from "@/lib/icon-set";
import { PALETTE_META, paletteColor } from "@/lib/palette";
import type { PaletteKey } from "@/lib/types";

export interface RoomDraft {
  name: string;
  description: string;
  icon: string;
  palette: PaletteKey;
}

const EMPTY: RoomDraft = {
  name: "",
  description: "",
  icon: ROOM_ICON_CHOICES[0],
  palette: "brass",
};

export function RoomDialog({
  open,
  onClose,
  onSubmit,
  initial,
  mode,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (draft: RoomDraft) => void;
  initial?: RoomDraft;
  mode: "create" | "edit";
}) {
  const [draft, setDraft] = useState<RoomDraft>(initial ?? EMPTY);
  const [wasOpen, setWasOpen] = useState(open);

  // Reset the draft each time the dialog transitions closed -> open.
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) setDraft(initial ?? EMPTY);
  }

  const submit = () => {
    if (!draft.name.trim()) return;
    onSubmit({ ...draft, name: draft.name.trim() });
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={mode === "create" ? "New room" : "Edit room"}
      description="Name your chamber, then give it an icon and a palette."
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={submit} disabled={!draft.name.trim()}>
            {mode === "create" ? "Create room" : "Save changes"}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <label className="mb-1.5 block text-xs tracking-widest text-muted uppercase">
            Name
          </label>
          <Input
            value={draft.name}
            onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
            onKeyDown={(e) => {
              if (e.key === "Enter") submit();
            }}
            placeholder="The Study"
            aria-label="Room name"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-xs tracking-widest text-muted uppercase">
            Description
          </label>
          <Textarea
            rows={2}
            value={draft.description}
            onChange={(e) =>
              setDraft((d) => ({ ...d, description: e.target.value }))
            }
            placeholder="What lives here?"
            aria-label="Room description"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-xs tracking-widest text-muted uppercase">
            Icon
          </label>
          <div className="grid grid-cols-6 gap-1.5">
            {ROOM_ICON_CHOICES.map((icon) => {
              const active = draft.icon === icon;
              return (
                <button
                  key={icon}
                  type="button"
                  onClick={() => setDraft((d) => ({ ...d, icon }))}
                  aria-pressed={active}
                  aria-label={icon}
                  className={`flex h-10 items-center justify-center rounded-lg border transition-colors ${
                    active
                      ? "border-accent-dim bg-surface-2 text-accent"
                      : "border-border-hair text-muted hover:border-border-strong hover:text-text"
                  }`}
                >
                  <RoomIcon name={icon} size={18} strokeWidth={1.75} />
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-xs tracking-widest text-muted uppercase">
            Palette
          </label>
          <div className="grid grid-cols-6 gap-1.5">
            {PALETTE_CHOICES.map((palette) => {
              const active = draft.palette === palette;
              return (
                <button
                  key={palette}
                  type="button"
                  onClick={() => setDraft((d) => ({ ...d, palette }))}
                  aria-pressed={active}
                  aria-label={PALETTE_META[palette].label}
                  className={`flex h-10 items-center justify-center rounded-lg border transition-transform ${
                    active
                      ? "border-accent-dim scale-105"
                      : "border-border-hair hover:border-border-strong"
                  }`}
                >
                  <span
                    className="h-5 w-5 rounded-full"
                    style={{ backgroundColor: paletteColor(palette) }}
                  />
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </Dialog>
  );
}
