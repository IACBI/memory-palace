"use client";

import { useId, useState } from "react";
import { Dialog } from "@/components/ui/Dialog";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { RoomIcon } from "@/components/RoomIcon";
import { ROOM_ICON_CHOICES, PALETTE_CHOICES } from "@/lib/icon-set";
import { PALETTE_META, paletteColor } from "@/lib/palette";
import { cn } from "@/lib/cn";
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

const FIELD_LABEL = "mb-1.5 block text-xs tracking-widest text-muted uppercase";

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
  const nameId = useId();
  const descriptionId = useId();
  const iconLabelId = useId();
  const paletteLabelId = useId();

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
          <Button
            variant="primary"
            onClick={submit}
            disabled={!draft.name.trim()}
          >
            {mode === "create" ? "Create room" : "Save changes"}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <label htmlFor={nameId} className={FIELD_LABEL}>
            Name
          </label>
          <Input
            id={nameId}
            value={draft.name}
            onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
            onKeyDown={(e) => {
              if (e.key === "Enter") submit();
            }}
            placeholder="The Study"
          />
        </div>

        <div>
          <label htmlFor={descriptionId} className={FIELD_LABEL}>
            Description
          </label>
          <Textarea
            id={descriptionId}
            rows={2}
            value={draft.description}
            onChange={(e) =>
              setDraft((d) => ({ ...d, description: e.target.value }))
            }
            placeholder="What lives here?"
          />
        </div>

        <div>
          <span id={iconLabelId} className={FIELD_LABEL}>
            Icon
          </span>
          <div
            role="group"
            aria-labelledby={iconLabelId}
            className="grid grid-cols-6 gap-1.5"
          >
            {ROOM_ICON_CHOICES.map((icon) => {
              const active = draft.icon === icon;
              return (
                <button
                  key={icon}
                  type="button"
                  onClick={() => setDraft((d) => ({ ...d, icon }))}
                  aria-pressed={active}
                  aria-label={icon}
                  className={cn(
                    "flex h-11 items-center justify-center rounded-md border transition-quiet",
                    active
                      ? "border-accent-dim bg-surface-2 text-accent"
                      : "border-border-hair text-muted hover:border-border-strong hover:text-text",
                  )}
                >
                  <RoomIcon
                    name={icon}
                    size={18}
                    strokeWidth={1.75}
                    aria-hidden
                  />
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <span id={paletteLabelId} className={FIELD_LABEL}>
            Palette
          </span>
          <div
            role="group"
            aria-labelledby={paletteLabelId}
            className="grid grid-cols-6 gap-1.5"
          >
            {PALETTE_CHOICES.map((palette) => {
              const active = draft.palette === palette;
              return (
                <button
                  key={palette}
                  type="button"
                  onClick={() => setDraft((d) => ({ ...d, palette }))}
                  aria-pressed={active}
                  aria-label={PALETTE_META[palette].label}
                  className={cn(
                    "flex h-11 items-center justify-center rounded-md border transition-transform",
                    active
                      ? "scale-105 border-accent-dim"
                      : "border-border-hair hover:border-border-strong",
                  )}
                >
                  <span
                    className="h-5 w-5 rounded-full"
                    style={{ backgroundColor: paletteColor(palette) }}
                    aria-hidden
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
