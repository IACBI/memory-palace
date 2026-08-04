import {
  StickyNote,
  Link2,
  Lightbulb,
  FileText,
  type LucideIcon,
} from "lucide-react";
import type { ObjectType } from "@/lib/types";

export const OBJECT_TYPE_META: Record<
  ObjectType,
  { icon: LucideIcon; label: string }
> = {
  note: { icon: StickyNote, label: "Note" },
  link: { icon: Link2, label: "Link" },
  idea: { icon: Lightbulb, label: "Idea" },
  file: { icon: FileText, label: "File" },
};

export const OBJECT_TYPES: ObjectType[] = ["note", "link", "idea", "file"];
