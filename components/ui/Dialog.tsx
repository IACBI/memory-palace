"use client";

import { useId } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { useFocusTrap } from "@/lib/hooks/use-focus-trap";
import { useDismissable } from "@/lib/hooks/use-dismissable";
import { cn } from "@/lib/cn";
import { IconButton } from "./IconButton";

export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = "md",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  /** `lg` is for reference content; prompts and confirmations stay `md`. */
  size?: "md" | "lg";
}) {
  const titleId = useId();
  const descId = useId();
  const panelRef = useFocusTrap<HTMLDivElement>(open);
  useDismissable(open, onClose);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    // Ends flush with the bottom on a phone and centres from `sm` up: a
    // centred dialog on a short viewport puts its actions under the keyboard.
    <div className="fixed inset-0 z-[var(--z-overlay)] flex items-end justify-center p-0 sm:items-center sm:p-4">
      <div
        className="motion-fade-in absolute inset-0 bg-black/70 backdrop-blur-[3px]"
        onClick={onClose}
        aria-hidden
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descId : undefined}
        className={cn(
          "motion-dialog-in relative z-[var(--z-raised)] max-h-[92vh] w-full overflow-y-auto rounded-t-xl border border-border-strong bg-surface p-5 shadow-overlay sm:rounded-xl sm:p-7",
          size === "lg" ? "sm:max-w-2xl" : "sm:max-w-md",
        )}
      >
        <IconButton
          label="Close dialog"
          onClick={onClose}
          className="absolute top-3 right-3"
        >
          <X size={16} strokeWidth={1.75} aria-hidden />
        </IconButton>
        <h2
          id={titleId}
          className="pr-10 font-display text-xl font-semibold tracking-tight text-text"
        >
          {title}
        </h2>
        {description ? (
          <p id={descId} className="mt-1.5 text-sm text-pretty text-muted">
            {description}
          </p>
        ) : null}
        {/* Reference-sized dialogs can outgrow a short viewport. A scrollable
            region whose content is all static text has no way in from the
            keyboard, so it becomes a tab stop of its own — otherwise anything
            below the fold is mouse-only. */}
        <div
          className={cn(
            "mt-5",
            size === "lg" && "max-h-[60vh] overflow-y-auto pr-1",
          )}
          {...(size === "lg"
            ? { tabIndex: 0, role: "group", "aria-labelledby": titleId }
            : {})}
        >
          {children}
        </div>
        {footer ? (
          <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:gap-3">
            {footer}
          </div>
        ) : null}
      </div>
    </div>,
    document.body,
  );
}
