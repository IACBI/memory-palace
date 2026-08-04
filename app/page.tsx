import type { Metadata } from "next";
import { Greeting } from "@/components/dashboard/Greeting";
import { DashboardBody } from "@/app/DashboardBody";
import { DashboardStats } from "@/app/DashboardStats";

/**
 * No `title` here on purpose: the root page shares a route segment with the
 * root layout, so `title.template` does not apply to it (per the metadata
 * docs). Falling through to `title.default` gives the home page the plain
 * brand name, which is what it should be anyway.
 */
export const metadata: Metadata = {
  description:
    "Where you left off: recent rooms, recent objects, and what changed in your palace.",
};

export default function DashboardPage() {
  return (
    <div className="mx-auto max-w-6xl px-5 py-10 sm:px-8">
      <header className="border-b border-border-hair pb-6">
        <Greeting />
        <DashboardStats />
      </header>
      <DashboardBody />
    </div>
  );
}
