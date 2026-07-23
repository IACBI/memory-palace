"use client";

import { useEffect } from "react";
import { TriangleAlert } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-8 text-center">
      <span className="mb-5 flex h-16 w-16 items-center justify-center rounded-full border border-border-hair bg-surface-2 text-danger">
        <TriangleAlert size={26} strokeWidth={1.5} />
      </span>
      <h1 className="font-display text-3xl tracking-wide text-text">
        A room came loose
      </h1>
      <p className="mt-2 max-w-md text-sm text-muted">
        Something went wrong while rendering the palace. Your saved data is
        untouched — try reloading this view.
      </p>
      <button
        type="button"
        onClick={reset}
        className="mt-6 inline-flex h-10 items-center justify-center rounded-lg bg-accent px-5 text-sm font-medium text-[#1a1410] transition-all duration-200 hover:bg-accent-hover focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2"
      >
        Reload this view
      </button>
    </div>
  );
}
