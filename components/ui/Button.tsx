"use client";

import { forwardRef } from "react";

type Variant = "primary" | "ghost" | "danger";
type Size = "sm" | "md";

const BASE =
  "inline-flex items-center justify-center gap-2 rounded-lg font-sans font-medium transition-all duration-200 focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50";

const VARIANTS: Record<Variant, string> = {
  primary:
    "bg-accent text-[#1a1410] hover:bg-accent-hover shadow-[0_0_0_0_transparent] hover:shadow-[0_2px_18px_-4px_var(--palace-accent-glow)]",
  ghost:
    "border border-border-hair bg-transparent text-text hover:border-border-strong hover:bg-surface-2",
  danger:
    "border border-danger/30 bg-danger/10 text-danger hover:border-danger/50 hover:bg-danger/15",
};

const SIZES: Record<Size, string> = {
  sm: "h-8 px-3 text-xs",
  md: "h-10 px-4 text-sm",
};

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "ghost", size = "md", className = "", type = "button", ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      className={`${BASE} ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
      {...props}
    />
  ),
);

Button.displayName = "Button";
