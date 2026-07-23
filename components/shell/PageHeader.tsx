"use client";

/** A consistent page heading: display-serif title with an optional subtitle. */
export function PageHeader({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4 border-b border-border-hair pb-6">
      <div className="min-w-0">
        <h1 className="font-display text-4xl leading-none font-semibold tracking-wide text-text">
          {title}
        </h1>
        {subtitle ? (
          <p className="mt-2 max-w-2xl text-sm text-muted">{subtitle}</p>
        ) : null}
      </div>
      {children ? <div className="flex items-center gap-3">{children}</div> : null}
    </div>
  );
}
