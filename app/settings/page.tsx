import type { Metadata } from "next";
import { PageHeader } from "@/components/shell/PageHeader";
import { SettingsBody } from "@/app/settings/SettingsBody";

export const metadata: Metadata = {
  title: "Settings",
  description:
    "Appearance preferences, export and import your palace, and keyboard shortcuts.",
};

export default function SettingsPage() {
  return (
    <div className="mx-auto max-w-3xl px-5 py-10 sm:px-8">
      <PageHeader
        title="Settings"
        subtitle="Preferences, your palace data, and a few things worth knowing."
      />
      <SettingsBody />
    </div>
  );
}
