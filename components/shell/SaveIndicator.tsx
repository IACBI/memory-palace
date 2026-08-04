"use client";

import { useEffect, useRef, useState } from "react";
import { Check, CloudOff } from "lucide-react";
import { useSaveStatus } from "@/lib/persistence";
import { useToastStore } from "@/lib/toast-store";
import { relativeTime } from "@/lib/activity-text";

/**
 * Shows where the user's work stands.
 *
 * Matters most in its failure state: this app writes to localStorage, and a
 * full quota used to be swallowed silently, so people could keep editing an
 * app that had stopped saving. That now raises a toast that does not
 * auto-dismiss, plus a persistent chip here.
 */
export function SaveIndicator() {
  const status = useSaveStatus((s) => s.status);
  const lastSavedAt = useSaveStatus((s) => s.lastSavedAt);
  const addToast = useToastStore((s) => s.addToast);
  const warnedRef = useRef(false);

  // Re-render on a slow tick so "4s ago" does not go stale while idle.
  const [, setTick] = useState(0);
  useEffect(() => {
    if (status !== "saved") return;
    const timer = setInterval(() => setTick((n) => n + 1), 30_000);
    return () => clearInterval(timer);
  }, [status]);

  useEffect(() => {
    if (status !== "error") {
      warnedRef.current = false;
      return;
    }
    if (warnedRef.current) return;
    warnedRef.current = true;
    addToast({
      message:
        "Your palace could not be saved — browser storage is full. Export a backup from Settings to keep your work.",
      variant: "error",
      duration: Number.POSITIVE_INFINITY,
    });
  }, [status, addToast]);

  if (status === "idle") return null;

  if (status === "error") {
    return (
      <span className="flex shrink-0 items-center gap-1.5 rounded-md border border-danger/40 px-2 py-1 text-[11px] text-danger">
        <CloudOff size={13} strokeWidth={1.75} aria-hidden />
        Not saved
      </span>
    );
  }

  return (
    <span
      className="hidden shrink-0 items-center gap-1.5 text-[11px] text-muted sm:flex"
      aria-live="polite"
    >
      {status === "pending" ? (
        <>
          <span
            className="h-1.5 w-1.5 animate-pulse rounded-full bg-muted"
            aria-hidden
          />
          Saving…
        </>
      ) : (
        <>
          <Check size={13} strokeWidth={2} aria-hidden />
          Saved
          {lastSavedAt
            ? ` ${relativeTime(new Date(lastSavedAt).toISOString())}`
            : ""}
        </>
      )}
    </span>
  );
}
