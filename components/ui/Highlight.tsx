import { Fragment } from "react";
import type { MatchRange } from "@/lib/search";

/**
 * Renders `text` with the searched-for slices marked.
 *
 * Ranges come from the search itself rather than being re-derived here, so a
 * multi-word query highlights each word where it actually matched instead of
 * looking for the whole query as one string and marking nothing.
 */
export function Highlight({
  text,
  ranges,
}: {
  text: string;
  ranges: readonly MatchRange[];
}) {
  if (ranges.length === 0) return <>{text}</>;

  const parts: React.ReactNode[] = [];
  let cursor = 0;

  ranges.forEach((range, index) => {
    // Defensive: a stale range against a since-edited title would slice
    // nonsense out of it.
    if (range.start < cursor || range.end > text.length) return;
    if (range.start > cursor) {
      parts.push(
        <Fragment key={`t${index}`}>
          {text.slice(cursor, range.start)}
        </Fragment>,
      );
    }
    parts.push(
      <mark
        key={`m${index}`}
        className="rounded-sm bg-accent/25 text-text not-italic"
      >
        {text.slice(range.start, range.end)}
      </mark>,
    );
    cursor = range.end;
  });

  if (cursor < text.length)
    parts.push(<Fragment key="tail">{text.slice(cursor)}</Fragment>);

  return <>{parts}</>;
}
