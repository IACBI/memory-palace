"use client";

import { useEffect } from "react";
import { TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function Error({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  /**
   * Re-renders the boundary's children. Preferred over `reset()`, which only
   * clears the error state — the button used to claim it reloaded the view
   * while doing nothing of the sort.
   */
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-6 text-center">
      <span className="mb-5 flex h-16 w-16 items-center justify-center rounded-full border border-border-hair bg-surface-2 text-danger">
        <TriangleAlert size={26} strokeWidth={1.5} aria-hidden />
      </span>
      <h1 className="font-display text-3xl font-bold tracking-tight text-balance text-text sm:text-4xl">
        A room came loose
      </h1>
      <p className="mt-2 max-w-md text-sm text-muted">
        Something went wrong while rendering the palace. Your saved data is
        untouched — try reloading this view.
      </p>
      <Button
        variant="primary"
        className="mt-6"
        onClick={() => unstable_retry()}
      >
        Reload this view
      </Button>
    </div>
  );
}
