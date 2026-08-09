import type { LucideIcon } from "lucide-react";

/** A centred empty state: icon, title, hint, and optional CTA. */
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
    // An empty screen is an invitation, so this is lit rather than outlined —
    // the dashed box it replaced read as a disabled dropzone.
    <div className="relative flex flex-col items-center justify-center overflow-hidden rounded-xl border border-border-hair bg-surface/50 px-6 py-14 text-center sm:px-8 sm:py-20">
      <span
        className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-[radial-gradient(60%_100%_at_50%_0%,var(--palace-accent-glow),transparent_70%)] opacity-25"
        aria-hidden
      />
      <span className="relative mb-5 flex h-14 w-14 items-center justify-center rounded-full border border-border-hair bg-surface-2 text-accent">
        <Icon size={24} strokeWidth={1.5} aria-hidden />
      </span>
      <h3 className="relative font-display text-2xl font-semibold tracking-tight text-text">
        {title}
      </h3>
      {hint ? (
        <p className="relative mt-2 max-w-sm text-sm text-muted">{hint}</p>
      ) : null}
      {action ? <div className="relative mt-6">{action}</div> : null}
    </div>
  );
}
