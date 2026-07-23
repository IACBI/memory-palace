"use client";

import { forwardRef } from "react";

const INPUT_CLASS =
  "w-full rounded-lg border border-border-hair bg-surface px-3 py-2 text-sm text-text placeholder:text-muted transition-colors duration-200 focus:border-accent-dim focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-1";

export const Input = forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className = "", ...props }, ref) => (
  <input ref={ref} className={`${INPUT_CLASS} ${className}`} {...props} />
));

Input.displayName = "Input";
