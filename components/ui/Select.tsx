"use client";

import { forwardRef } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/cn";

const SELECT_CLASS =
  "h-11 w-full appearance-none rounded-md border border-border-control bg-surface px-3.5 pr-9 text-sm text-text transition-quiet focus:border-accent-dim focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-1";

export const Select = forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>(({ className, children, ...props }, ref) => (
  <div className="relative">
    <select ref={ref} className={cn(SELECT_CLASS, className)} {...props}>
      {children}
    </select>
    <ChevronDown
      size={15}
      strokeWidth={1.75}
      className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-muted"
      aria-hidden
    />
  </div>
));

Select.displayName = "Select";
