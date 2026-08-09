/**
 * A consistent page heading: display title, optional subtitle, optional
 * actions.
 *
 * The rule underneath is a gradient rather than a flat border. Every surface
 * in this identity is lit from the leading edge, and a hairline that fades out
 * as it travels away from that edge says "light falling across the top of a
 * page" where an even 1px line says "table border". It is the cheapest place
 * the direction shows up, and it appears on four of the seven screens.
 */
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
    <div className="pb-6 sm:pb-8">
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-4 pb-5 sm:pb-6">
        <div className="min-w-0">
          <h1 className="font-display text-3xl font-bold tracking-tight text-balance text-text sm:text-4xl">
            {title}
          </h1>
          {subtitle ? (
            <p className="mt-3 max-w-2xl text-sm text-pretty text-muted">
              {subtitle}
            </p>
          ) : null}
        </div>
        {children ? (
          <div className="flex items-center gap-2 sm:gap-3">{children}</div>
        ) : null}
      </div>
      <div
        className="h-px bg-gradient-to-r from-border-strong via-border-hair to-transparent"
        aria-hidden
      />
    </div>
  );
}
