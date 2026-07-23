"use client";

import { X } from "lucide-react";

/** A small palette-aware pill, optionally removable. */
export function Tag({
  children,
  color,
  onRemove,
}: {
  children: React.ReactNode;
  color?: string;
  onRemove?: () => void;
}) {
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] leading-none text-text"
      style={{
        borderColor: color ? `${color}55` : "var(--palace-border)",
        backgroundColor: color ? `${color}1f` : "var(--palace-surface-2)",
      }}
    >
      <span className="truncate">{children}</span>
      {onRemove ? (
        <button
          type="button"
          onClick={onRemove}
          className="-mr-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full text-muted transition-colors hover:text-text"
          aria-label="Remove tag"
        >
          <X size={11} strokeWidth={2} />
        </button>
      ) : null}
    </span>
  );
}
