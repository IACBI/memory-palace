"use client";

/** A small keyboard-key badge. */
export function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex h-5 min-w-5 items-center justify-center rounded border border-border-strong bg-surface-2 px-1.5 font-sans text-[11px] tracking-widest text-muted">
      {children}
    </kbd>
  );
}
