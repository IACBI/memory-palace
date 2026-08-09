"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { Download, Share } from "lucide-react";
import { Button } from "@/components/ui/Button";

/**
 * `beforeinstallprompt` is a Chromium event with no TypeScript DOM definition.
 * Declared to the shape actually used rather than cast away.
 */
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  readonly userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

/**
 * Whether the app is running from the home screen or dock.
 *
 * Subscribed rather than read once: this flips while the app is open when the
 * reader installs it from the browser's own menu.
 */
function useStandalone(): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const query = window.matchMedia("(display-mode: standalone)");
      query.addEventListener("change", onChange);
      return () => query.removeEventListener("change", onChange);
    },
    () =>
      window.matchMedia("(display-mode: standalone)").matches ||
      // Safari's own flag, which predates the standard media query.
      ("standalone" in navigator && navigator.standalone === true),
    () => false,
  );
}

/** iOS never fires `beforeinstallprompt`, so it needs instructions instead. */
function useIos(): boolean {
  return useSyncExternalStore(
    () => () => {},
    () => /iPad|iPhone|iPod/.test(navigator.userAgent),
    () => false,
  );
}

/**
 * Offers to install the palace as an app.
 *
 * Chromium hands over an install prompt; Safari never does, so iOS gets the
 * one thing that actually works there. Nothing renders when the app is already
 * installed or the browser has no path to installing it.
 */
export function InstallApp() {
  const [prompt, setPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [justInstalled, setJustInstalled] = useState(false);
  const standalone = useStandalone();
  const ios = useIos();

  useEffect(() => {
    const onBeforeInstall = (event: Event) => {
      // Chromium shows its own mini-infobar otherwise, which cannot be styled
      // and appears at a moment the app has no say in.
      event.preventDefault();
      setPrompt(event as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setJustInstalled(true);
      setPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (standalone || justInstalled) {
    return (
      <p className="text-xs text-muted">
        Installed. The palace opens in its own window and works offline.
      </p>
    );
  }

  if (prompt) {
    return (
      <Button
        variant="ghost"
        onClick={async () => {
          await prompt.prompt();
          // A prompt can only be used once, whatever the reader chooses.
          setPrompt(null);
        }}
      >
        <Download size={15} strokeWidth={1.75} aria-hidden /> Install app
      </Button>
    );
  }

  if (ios) {
    return (
      <p className="flex items-center gap-2 text-xs text-muted">
        <Share size={14} strokeWidth={1.75} aria-hidden />
        To install: tap Share, then “Add to Home Screen”.
      </p>
    );
  }

  return null;
}
