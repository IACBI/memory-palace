"use client";

import { useId } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { useFocusTrap } from "@/lib/hooks/use-focus-trap";
import { useDismissable } from "@/lib/hooks/use-dismissable";

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="motion-fade-in absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descId : undefined}
        className={`motion-dialog-in relative z-10 w-full rounded-2xl border border-border-strong bg-surface p-6 shadow-[0_24px_80px_-12px_rgba(0,0,0,0.7)] ${
          size === "lg" ? "max-w-2xl" : "max-w-md"
        }`}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close dialog"
          className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-lg text-muted transition-colors hover:bg-surface-2 hover:text-text"
        >
          <X size={16} strokeWidth={1.75} />
        </button>
        <h2
          id={titleId}
          className="font-display text-2xl tracking-wide text-text"
        >
          {title}
        </h2>
        {description ? (
          <p id={descId} className="mt-1 text-sm text-muted">
            {description}
          </p>
        ) : null}
        {/* Reference-sized dialogs can outgrow a short viewport; the body
            scrolls so the title and close button stay put.
            A scrollable region whose content is all static text has no way in
            from the keyboard, so it becomes a tab stop of its own — otherwise
            anything below the fold is mouse-only. */}
        <div
          className={`mt-5 ${size === "lg" ? "max-h-[65vh] overflow-y-auto pr-1" : ""}`}
          {...(size === "lg"
            ? { tabIndex: 0, role: "group", "aria-labelledby": titleId }
            : {})}
        >
          {children}
        </div>
        {footer ? (
          <div className="mt-6 flex justify-end gap-3">{footer}</div>
        ) : null}
      </div>
    </div>,
    document.body,
  );
}
