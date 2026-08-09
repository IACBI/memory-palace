"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/cn";

type Variant = "quiet" | "ghost";

const VARIANTS: Record<Variant, string> = {
  quiet: "text-muted hover:bg-surface-2 hover:text-text",
  ghost:
    "border border-border-hair text-text hover:border-border-strong hover:bg-surface-2",
};

export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Required: an icon alone has no accessible name. */
  label: string;
  variant?: Variant;
}

/**
 * An icon-only control, a real 44px square.
 *
 * Deliberately sized rather than expanded with `.hit-area`. A pseudo-element
 * target that reaches past its own box works for a control standing alone, but
 * these appear in clusters — the graph's zoom stack, the connection toolbar,
 * the row of accent swatches — spaced 4 to 10px apart. Four 44px targets over
 * 36px boxes overlap, and a tap landing between two of them activates the
 * wrong one. Growing the box instead makes the target and the hit region the
 * same rectangle, so adjacent controls cannot steal each other's presses.
 *
 * The icon inside stays small; what grows is the padding around it. Call sites
 * should not shrink this below 44px — that is the whole point of the component.
 */
export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ label, variant = "quiet", className, type = "button", ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      aria-label={label}
      className={cn(
        "inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-md transition-quiet focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-45",
        VARIANTS[variant],
        className,
      )}
      {...props}
    />
  ),
);

IconButton.displayName = "IconButton";
