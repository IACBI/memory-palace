"use client";

import { forwardRef } from "react";
import { ChevronDown } from "lucide-react";

const SELECT_CLASS =
  "w-full appearance-none rounded-lg border border-border-hair bg-surface px-3 py-2 pr-9 text-sm text-text transition-colors duration-200 focus:border-accent-dim focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-1";

export const Select = forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>(({ className = "", children, ...props }, ref) => (
  <div className="relative">
    <select ref={ref} className={`${SELECT_CLASS} ${className}`} {...props}>
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
