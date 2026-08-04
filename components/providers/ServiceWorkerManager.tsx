"use client";

import { useEffect } from "react";
import { toast } from "@/lib/toast-store";

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
const BUILD_ID = process.env.NEXT_PUBLIC_BUILD_ID ?? "dev";

/**
 * Registers the offline worker and offers the reader an update when one lands.
 *
 * The new worker is never activated behind the reader's back. It installs,
 * waits, and takes over only when they accept — a swap mid-session can leave a
 * page running code that no longer matches the chunks it will ask for next.
 */
export function ServiceWorkerManager() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    // A worker registered from a `file:` or insecure origin throws; and in dev
    // it would cache a build that changes on every keystroke.
    if (process.env.NODE_ENV !== "production") return;

    let cancelled = false;

    const promptToUpdate = (waiting: ServiceWorker) => {
      toast({
        message: "A new version of Memory Palace is ready.",
        duration: Infinity,
        action: {
          label: "Reload",
          onClick: () => {
            waiting.postMessage("SKIP_WAITING");
            // `controllerchange` rather than reloading straight away: the new
            // worker has to be in control before the page asks it for assets.
            navigator.serviceWorker.addEventListener(
              "controllerchange",
              () => window.location.reload(),
              { once: true },
            );
          },
        },
      });
    };

    navigator.serviceWorker
      .register(`${BASE_PATH}/sw.js?v=${BUILD_ID}`, {
        scope: `${BASE_PATH}/`,
        // Never let the HTTP cache answer for the worker script itself.
        updateViaCache: "none",
      })
      .then((registration) => {
        if (cancelled) return;

        // Already waiting when this tab opened.
        if (registration.waiting && navigator.serviceWorker.controller) {
          promptToUpdate(registration.waiting);
        }

        registration.addEventListener("updatefound", () => {
          const installing = registration.installing;
          if (!installing) return;
          installing.addEventListener("statechange", () => {
            // A worker that reaches `installed` with no controller is the very
            // first one; there is nothing to update from and nothing to say.
            if (
              installing.state === "installed" &&
              navigator.serviceWorker.controller
            ) {
              promptToUpdate(installing);
            }
          });
        });
      })
      .catch(() => {
        // Offline support is an enhancement; a browser that refuses the
        // registration still gets a fully working app.
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}
