"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "ghost" | "danger" | "quiet";
type Size = "sm" | "md" | "lg";

const BASE =
  "inline-flex items-center justify-center gap-2 rounded-md font-sans text-nowrap font-medium tracking-tight transition-quiet focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-45";

const VARIANTS: Record<Variant, string> = {
  /** The lit control. `shadow-spill` is the warm pool the accent throws. */
  primary: "bg-accent text-on-accent hover:bg-accent-hover hover:shadow-spill",
  ghost:
    "border border-border-strong bg-transparent text-text hover:border-accent-dim hover:bg-surface-2",
  danger:
    "border border-danger/35 bg-danger/10 text-danger hover:border-danger/60 hover:bg-danger/15",
  /** No box until hovered — for dense rows and toolbars. */
  quiet: "bg-transparent text-muted hover:bg-surface-2 hover:text-text",
};

/**
 * Heights clear the 44px touch floor from `md` up. `sm` is 36px and is for
 * controls that sit inside an already-large target (a dialog footer, a toolbar
 * row); it never carries a lone tap target on a touch screen.
 */
const SIZES: Record<Size, string> = {
  sm: "h-9 px-3 text-xs",
  md: "h-11 px-4 text-sm",
  lg: "h-12 px-5 text-base",
};

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { variant = "ghost", size = "md", className, type = "button", ...props },
    ref,
  ) => (
    <button
      ref={ref}
      type={type}
      className={cn(BASE, VARIANTS[variant], SIZES[size], className)}
      {...props}
    />
  ),
);

Button.displayName = "Button";
