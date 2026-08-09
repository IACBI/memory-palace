"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { usePalaceStore } from "@/lib/store";
import { useToastStore } from "@/lib/toast-store";
import type { ObjectType } from "@/lib/types";
import { OBJECT_TYPES, OBJECT_TYPE_META } from "@/lib/object-meta";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

/** Inline control to create an object without leaving the dashboard. */
export function QuickAdd() {
  const rooms = usePalaceStore((s) => s.rooms);
  const createObject = usePalaceStore((s) => s.createObject);
  const openObject = usePalaceStore((s) => s.openObject);
  const addToast = useToastStore((s) => s.addToast);

  const [title, setTitle] = useState("");
  const [type, setType] = useState<ObjectType>("note");
  const [roomId, setRoomId] = useState(rooms[0]?.id ?? "");

  const disabled = !title.trim() || !roomId;

  const submit = () => {
    if (disabled) return;
    const created = createObject({
      roomId,
      type,
      title: title.trim(),
      position: { x: 40 + Math.random() * 20, y: 40 + Math.random() * 20 },
    });
    setTitle("");
    addToast({ message: `Added "${created.title}"`, variant: "success" });
    openObject(created.id);
  };

  if (rooms.length === 0) return null;

  return (
    <Card className="p-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") submit();
          }}
          placeholder="Quick add an object…"
          aria-label="New object title"
          className="flex-1"
        />
        <div className="grid grid-cols-2 gap-2 sm:flex sm:shrink-0">
          <Select
            value={type}
            onChange={(e) => setType(e.target.value as ObjectType)}
            aria-label="Object type"
            className="sm:w-28"
          >
            {OBJECT_TYPES.map((t) => (
              <option key={t} value={t}>
                {OBJECT_TYPE_META[t].label}
              </option>
            ))}
          </Select>
          <Select
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            aria-label="Room"
            className="sm:w-40"
          >
            {rooms.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </Select>
          <Button
            variant="primary"
            onClick={submit}
            disabled={disabled}
            className="col-span-2 sm:col-auto"
          >
            <Plus size={16} strokeWidth={2} aria-hidden />
            Add
          </Button>
        </div>
      </div>
    </Card>
  );
}
