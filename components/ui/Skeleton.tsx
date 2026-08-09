import { cn } from "@/lib/cn";

/** A shimmering placeholder block. Server-renderable: no hooks, no handlers. */
export function Skeleton({
  className,
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-surface-2", className)}
      style={style}
      aria-hidden
    />
  );
}
