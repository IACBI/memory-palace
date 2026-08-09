"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/cn";

const TEXTAREA_CLASS =
  "w-full resize-none rounded-md border border-border-control bg-surface px-3.5 py-2.5 text-sm leading-relaxed text-text placeholder:text-muted transition-quiet focus:border-accent-dim focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-1";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  /** When true, the textarea auto-grows to fit its content. */
  autoGrow?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, autoGrow = false, onInput, rows = 3, ...props }, ref) => (
    <textarea
      ref={ref}
      rows={rows}
      className={cn(TEXTAREA_CLASS, className)}
      onInput={(event) => {
        if (autoGrow) {
          const el = event.currentTarget;
          el.style.height = "auto";
          el.style.height = `${el.scrollHeight}px`;
        }
        onInput?.(event);
      }}
      {...props}
    />
  ),
);

Textarea.displayName = "Textarea";
