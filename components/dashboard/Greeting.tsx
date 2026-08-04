"use client";

import { useSyncExternalStore } from "react";

function greetingFor(hour: number): string {
  if (hour < 5) return "Still awake";
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  if (hour < 21) return "Good evening";
  return "Good night";
}

/** The hour never changes underneath us within a page view. */
const subscribe = () => () => {};
const getHour = () => new Date().getHours();
const getServerHour = () => null;

/**
 * A greeting that is correct for the reader, not for the build machine.
 *
 * The static export is prerendered once, so the hour at build time means
 * nothing to a visitor in another timezone. `useSyncExternalStore` renders the
 * neutral server snapshot during hydration and the reader's own hour
 * immediately after — real text in the HTML, no mismatch, and no setState in
 * an effect.
 */
export function Greeting() {
  const hour = useSyncExternalStore(subscribe, getHour, getServerHour);

  return (
    <h1 className="font-display text-4xl leading-none font-semibold tracking-wide text-text">
      {hour === null ? "Welcome back" : greetingFor(hour)}
    </h1>
  );
}
