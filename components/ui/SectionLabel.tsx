/**
 * The heading above a group of things.
 *
 * A small label and a rule that fades as it travels right, matching the one
 * under every page title. Server-renderable — no hooks, no handlers.
 *
 * `as` exists because the level depends on the screen: a section inside a page
 * that already has an `h1` wants `h2`, but the settings screen nests groups
 * inside sections and needs `h3` for them. Getting this wrong is the most
 * common way a redesign breaks heading order for a screen reader.
 */
export function SectionLabel({
  children,
  as: Tag = "h2",
  trailing,
}: {
  children: React.ReactNode;
  as?: "h2" | "h3";
  /** A count, a control — whatever belongs at the end of the rule. */
  trailing?: React.ReactNode;
}) {
  return (
    <div className="mb-4 flex items-center gap-4">
      <Tag className="shrink-0 text-2xs font-medium tracking-[0.18em] text-muted uppercase">
        {children}
      </Tag>
      <span
        className="h-px flex-1 bg-gradient-to-r from-border-strong to-transparent"
        aria-hidden
      />
      {trailing ? <span className="shrink-0">{trailing}</span> : null}
    </div>
  );
}
