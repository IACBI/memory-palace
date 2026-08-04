"use client";

import { forwardRef } from "react";

const TEXTAREA_CLASS =
  "w-full resize-none rounded-lg border border-border-control bg-surface px-3 py-2 text-sm leading-relaxed text-text placeholder:text-muted transition-colors duration-200 focus:border-accent-dim focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-1";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  /** When true, the textarea auto-grows to fit its content. */
  autoGrow?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className = "", autoGrow = false, onInput, rows = 3, ...props }, ref) => (
    <textarea
      ref={ref}
      rows={rows}
      className={`${TEXTAREA_CLASS} ${className}`}
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
