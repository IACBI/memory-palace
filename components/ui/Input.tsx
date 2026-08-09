"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/cn";

/** 44px tall, so a text field is never the thing a thumb misses. */
const INPUT_CLASS =
  "h-11 w-full rounded-md border border-border-control bg-surface px-3.5 text-sm text-text placeholder:text-muted transition-quiet focus:border-accent-dim focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-1";

export const Input = forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => (
  <input ref={ref} className={cn(INPUT_CLASS, className)} {...props} />
));

Input.displayName = "Input";
