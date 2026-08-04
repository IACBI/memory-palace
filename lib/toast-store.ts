import { create } from "zustand";
import { newId } from "@/lib/id";

export type ToastVariant = "default" | "success" | "error";

export interface ToastAction {
  label: string;
  onClick: () => void;
}

export interface Toast {
  id: string;
  message: string;
  variant: ToastVariant;
  action?: ToastAction;
  /** Auto-dismiss delay in ms. */
  duration: number;
}

export interface ToastInput {
  message: string;
  variant?: ToastVariant;
  action?: ToastAction;
  duration?: number;
}

interface ToastState {
  toasts: Toast[];
  addToast: (input: ToastInput) => string;
  dismissToast: (id: string) => void;
}

const DEFAULT_DURATION = 4000;

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  addToast: (input) => {
    const id = newId();
    const toast: Toast = {
      id,
      message: input.message,
      variant: input.variant ?? "default",
      action: input.action,
      duration: input.duration ?? DEFAULT_DURATION,
    };
    set((state) => ({ toasts: [...state.toasts, toast] }));
    return id;
  },
  dismissToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((toast) => toast.id !== id),
    })),
}));

/** Convenience helper usable outside React. */
export function toast(input: ToastInput): string {
  return useToastStore.getState().addToast(input);
}
