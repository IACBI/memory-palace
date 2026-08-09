"use client";

import { useCallback, useEffect } from "react";
import { X } from "lucide-react";
import { useToastStore, type Toast } from "@/lib/toast-store";
import { IconButton } from "./IconButton";

const VARIANT_ACCENT: Record<Toast["variant"], string> = {
  default: "var(--palace-accent)",
  success: "var(--palette-forest)",
  error: "var(--palace-danger)",
};

function ToastRow({ toast }: { toast: Toast }) {
  const dismissToast = useToastStore((state) => state.dismissToast);
  const close = useCallback(
    () => dismissToast(toast.id),
    [dismissToast, toast.id],
  );

  useEffect(() => {
    // A non-finite duration means "stays until dismissed". Passing it to
    // setTimeout would coerce to 0 and close the toast immediately.
    if (!Number.isFinite(toast.duration)) return;
    const timer = setTimeout(close, toast.duration);
    return () => clearTimeout(timer);
  }, [toast.duration, close]);

  return (
    <div
      className="motion-toast-in pointer-events-auto flex items-center gap-2 rounded-lg border border-border-strong bg-surface py-2 pr-2 pl-4 shadow-overlay"
      style={{
        borderLeftColor: VARIANT_ACCENT[toast.variant],
        borderLeftWidth: 3,
      }}
    >
      <span className="flex-1 py-1 text-sm text-text">{toast.message}</span>
      {toast.action ? (
        <button
          type="button"
          onClick={() => {
            toast.action?.onClick();
            close();
          }}
          className="h-9 rounded-md px-3 text-xs font-medium text-accent transition-quiet hover:bg-surface-2"
        >
          {toast.action.label}
        </button>
      ) : null}
      <IconButton label="Dismiss" onClick={close}>
        <X size={14} strokeWidth={1.75} aria-hidden />
      </IconButton>
    </div>
  );
}

/**
 * Renders active toasts in a fixed stack — bottom-centre on a phone, where the
 * thumb is, and bottom-right from `sm` up.
 *
 * The live region is this container, which is in the document from the start.
 * `role="status"` used to sit on each row, inserted into the DOM at the same
 * moment as its text — a live region has to exist *before* content lands in it
 * to be announced reliably. That matters here more than usual: a toast is the
 * only undo affordance for a delete, and it auto-dismisses.
 */
export function Toaster() {
  const toasts = useToastStore((state) => state.toasts);

  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="false"
      className="pointer-events-none fixed inset-x-3 bottom-3 z-[var(--z-toast)] flex flex-col gap-2 sm:inset-x-auto sm:right-4 sm:bottom-4 sm:w-full sm:max-w-sm"
    >
      {toasts.map((toast) => (
        <ToastRow key={toast.id} toast={toast} />
      ))}
    </div>
  );
}
