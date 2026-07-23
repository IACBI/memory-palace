"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import { useToastStore, type Toast } from "@/lib/toast-store";

const VARIANT_ACCENT: Record<Toast["variant"], string> = {
  default: "var(--palace-accent)",
  success: "var(--palette-forest)",
  error: "var(--palace-danger)",
};

function ToastRow({ toast }: { toast: Toast }) {
  const dismissToast = useToastStore((state) => state.dismissToast);

  useEffect(() => {
    const timer = setTimeout(() => dismissToast(toast.id), toast.duration);
    return () => clearTimeout(timer);
  }, [toast.id, toast.duration, dismissToast]);

  return (
    <div
      role="status"
      className="animate-[toastIn_200ms_ease-out] pointer-events-auto flex items-center gap-3 rounded-xl border border-border-strong bg-surface px-4 py-3 shadow-[0_12px_40px_-8px_rgba(0,0,0,0.6)]"
      style={{ borderLeftColor: VARIANT_ACCENT[toast.variant], borderLeftWidth: 3 }}
    >
      <span className="flex-1 text-sm text-text">{toast.message}</span>
      {toast.action ? (
        <button
          type="button"
          onClick={() => {
            toast.action?.onClick();
            dismissToast(toast.id);
          }}
          className="rounded-md px-2 py-1 text-xs font-medium text-accent transition-colors hover:bg-surface-2"
        >
          {toast.action.label}
        </button>
      ) : null}
      <button
        type="button"
        onClick={() => dismissToast(toast.id)}
        aria-label="Dismiss"
        className="flex h-6 w-6 items-center justify-center rounded-md text-muted transition-colors hover:bg-surface-2 hover:text-text"
      >
        <X size={14} strokeWidth={1.75} />
      </button>
    </div>
  );
}

/** Renders active toasts in a fixed bottom-right stack. */
export function Toaster() {
  const toasts = useToastStore((state) => state.toasts);

  return (
    <div className="pointer-events-none fixed right-4 bottom-4 z-[60] flex w-full max-w-sm flex-col gap-2">
      {toasts.map((toast) => (
        <ToastRow key={toast.id} toast={toast} />
      ))}
    </div>
  );
}
