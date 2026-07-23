"use client";

import type { LucideIcon } from "lucide-react";

/** A centered empty-state: icon, title, hint, and optional CTA. */
export function EmptyState({
  icon: Icon,
  title,
  hint,
  action,
}: {
  icon: LucideIcon;
  title: string;
  hint?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border-hair bg-surface/40 px-8 py-14 text-center">
      <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-border-hair bg-surface-2 text-muted">
        <Icon size={24} strokeWidth={1.5} />
      </span>
      <h3 className="font-display text-xl tracking-wide text-text">{title}</h3>
      {hint ? <p className="mt-1.5 max-w-sm text-sm text-muted">{hint}</p> : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
