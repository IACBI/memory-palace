"use client";

import { cn } from "@/lib/cn";

/**
 * An accessible on/off toggle.
 *
 * The track stays 24px tall so the control still reads as a switch, and
 * `hit-area` lifts the tap target to the full 44px around it.
 */
export function Switch({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cn(
        "hit-area inline-flex h-6 w-11 shrink-0 items-center rounded-full border transition-quiet",
        checked
          ? "border-accent-dim bg-accent/25"
          : "border-border-control bg-surface-2",
      )}
    >
      <span
        className={cn(
          "absolute left-0.5 h-5 w-5 rounded-full transition-[translate,background-color] duration-[var(--duration-base)] ease-[var(--ease-out-deep)]",
          checked ? "translate-x-5 bg-accent" : "translate-x-0 bg-muted",
        )}
        aria-hidden
      />
    </button>
  );
}
