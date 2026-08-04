import Link from "next/link";
import type { Metadata } from "next";
import { Compass } from "lucide-react";

export const metadata: Metadata = {
  title: "Not found",
};

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-lg flex-col items-center px-6 py-24 text-center">
      <span className="mb-5 flex h-16 w-16 items-center justify-center rounded-full border border-border-hair bg-surface-2 text-muted">
        <Compass size={26} strokeWidth={1.5} aria-hidden />
      </span>
      <h1 className="font-display text-3xl tracking-wide text-text">
        No such room
      </h1>
      <p className="mt-3 text-sm text-muted">
        This corridor doesn&apos;t lead anywhere. The page may have been
        renamed, or the link may be mistaken.
      </p>
      <Link
        href="/palace"
        className="mt-7 inline-flex h-10 items-center justify-center rounded-lg bg-accent px-5 text-sm font-medium text-on-accent transition-colors hover:bg-accent-hover focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2"
      >
        Back to the palace
      </Link>
    </div>
  );
}
