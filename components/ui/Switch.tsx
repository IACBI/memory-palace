"use client";

/** An accessible on/off toggle. Brass when on, muted when off. */
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
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border transition-colors duration-200 ${
        checked
          ? "border-accent-dim bg-accent/25"
          : "border-border-control bg-surface-2"
      }`}
    >
      <span
        className={`absolute left-0.5 h-5 w-5 rounded-full transition-transform duration-200 ${
          checked ? "translate-x-5 bg-accent" : "translate-x-0 bg-muted"
        }`}
        aria-hidden
      />
    </button>
  );
}
