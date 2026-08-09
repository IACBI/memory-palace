import type { Metadata } from "next";
import { PageHeader } from "@/components/shell/PageHeader";
import { LibraryBody } from "@/app/library/LibraryBody";

export const metadata: Metadata = {
  title: "Library",
  description:
    "Every object across every room, in one searchable and filterable list.",
};

export default function LibraryPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-8 sm:py-10">
      <PageHeader
        title="Library"
        subtitle="Every object across every room. Search, filter, and sort."
      />
      <LibraryBody />
    </div>
  );
}
