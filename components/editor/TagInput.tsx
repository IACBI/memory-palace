"use client";

import { useState } from "react";
import { Tag } from "@/components/ui/Tag";

/** Tag editor: type + Enter to add, Backspace removes last, suggests existing. */
export function TagInput({
  value,
  onChange,
  suggestions,
  labelledBy,
}: {
  value: string[];
  onChange: (next: string[]) => void;
  suggestions: string[];
  /** Id of the visible group heading that names this control. */
  labelledBy?: string;
}) {
  const [draft, setDraft] = useState("");

  const add = (raw: string) => {
    const tag = raw.trim().toLowerCase();
    if (!tag || value.includes(tag)) {
      setDraft("");
      return;
    }
    onChange([...value, tag]);
    setDraft("");
  };

  const remove = (tag: string) => onChange(value.filter((t) => t !== tag));

  const matches = suggestions
    .filter((s) => !value.includes(s))
    .filter((s) => (draft ? s.includes(draft.toLowerCase()) : false))
    .slice(0, 6);

  return (
    <div role="group" aria-labelledby={labelledBy}>
      <div className="flex flex-wrap items-center gap-1.5 rounded-lg border border-border-hair bg-surface px-2 py-2 focus-within:border-accent-dim">
        {value.map((tag) => (
          <Tag key={tag} onRemove={() => remove(tag)}>
            {tag}
          </Tag>
        ))}
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add(draft);
            } else if (e.key === "Backspace" && !draft && value.length > 0) {
              remove(value[value.length - 1]);
            }
          }}
          placeholder={value.length === 0 ? "Add tags…" : ""}
          className="min-w-[6rem] flex-1 bg-transparent px-1 py-0.5 text-sm text-text placeholder:text-muted focus:outline-none"
          aria-label="Add a tag"
        />
      </div>
      {matches.length > 0 ? (
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {matches.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => add(s)}
              className="rounded-full border border-border-hair bg-surface-2 px-2 py-0.5 text-[11px] text-muted transition-colors hover:border-border-strong hover:text-text"
            >
              + {s}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
