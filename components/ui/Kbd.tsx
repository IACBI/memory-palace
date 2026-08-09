/** A small keyboard-key badge. Server-renderable. */
export function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="tabular inline-flex h-5 min-w-5 items-center justify-center rounded-sm border border-border-strong bg-surface-2 px-1.5 font-sans text-2xs tracking-widest text-muted">
      {children}
    </kbd>
  );
}
