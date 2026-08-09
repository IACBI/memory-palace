import type { Metadata } from "next";
import { PageHeader } from "@/components/shell/PageHeader";
import { NewRoomButton } from "@/app/palace/NewRoomButton";
import { PalaceBody } from "@/app/palace/PalaceBody";

export const metadata: Metadata = {
  title: "The Palace",
  description:
    "Your rooms, laid out as a floor plan. Every topic gets a chamber.",
};

export default function PalacePage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-8 sm:py-10">
      <PageHeader
        title="The Palace"
        subtitle="Your rooms, laid out as a floor plan. Open a chamber to enter."
      >
        <NewRoomButton />
      </PageHeader>
      <PalaceBody />
    </div>
  );
}
