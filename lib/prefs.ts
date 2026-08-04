import { DEFAULT_SETTINGS } from "@/lib/settings";
import type {
  AccentKey,
  PalaceSettings,
  TextSize,
  ThemeKey,
} from "@/lib/types";

/**
 * A tiny mirror of the display preferences, separate from the palace document.
 *
 * The inline `<head>` script has to read these before the first paint, and
 * parsing the whole palace (potentially megabytes) to find three fields would
 * block rendering. This key holds ~60 bytes.
 */
export const PREFS_KEY = "memory-palace-prefs:v1";

export interface DisplayPrefs {
  theme: ThemeKey;
  accent: AccentKey;
  textSize: TextSize;
  reduceMotion: boolean;
}

export const DEFAULT_PREFS: DisplayPrefs = {
  theme: DEFAULT_SETTINGS.theme,
  accent: DEFAULT_SETTINGS.accent,
  textSize: DEFAULT_SETTINGS.textSize,
  reduceMotion: DEFAULT_SETTINGS.reduceMotion,
};

/** Narrows the display subset out of the full settings object. */
export function toDisplayPrefs(settings: PalaceSettings): DisplayPrefs {
  return {
    theme: settings.theme,
    accent: settings.accent,
    textSize: settings.textSize,
    reduceMotion: settings.reduceMotion,
  };
}

/**
 * Resolves `auto` against the operating system's own light/dark preference.
 *
 * Only ever `palace` or `parchment` comes out, because the stylesheet keys off
 * a concrete theme: leaving `auto` on the element would mean writing every
 * token twice, once plainly and once inside a media query.
 */
export function resolveTheme(theme: ThemeKey): "palace" | "parchment" {
  if (theme !== "auto") return theme;
  if (typeof window === "undefined" || !window.matchMedia) return "palace";
  return window.matchMedia("(prefers-color-scheme: light)").matches
    ? "parchment"
    : "palace";
}

/**
 * Whether movement should be minimised, by the in-app toggle or the system.
 *
 * CSS reads both of these on its own; this is for the places that animate in
 * JavaScript — the graph's settling layout — and cannot.
 */
export function prefersReducedMotion(): boolean {
  if (typeof document === "undefined") return false;
  if (document.documentElement.dataset.reduceMotion === "true") return true;
  return Boolean(
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches,
  );
}

/** Applies preferences to `<html>` as data attributes the CSS themes read. */
export function applyDisplayPrefs(prefs: DisplayPrefs): void {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.dataset.theme = resolveTheme(prefs.theme);
  root.dataset.accent = prefs.accent;
  root.dataset.textSize = prefs.textSize;
  root.dataset.reduceMotion = prefs.reduceMotion ? "true" : "false";
}

/** Persists the mirror. Failures are ignored: it is a cache, not the source. */
export function writeDisplayPrefs(prefs: DisplayPrefs): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
  } catch {
    // Private mode or a full quota — the app still works, it just flashes
    // the default theme on the next hard load.
  }
}

/**
 * Runs synchronously while the browser parses `<head>`, so the user's accent,
 * reading size and motion preference are in place before anything is painted.
 *
 * Deliberately terse and dependency-free — it is inlined into the HTML.
 * Requires `'unsafe-inline'` in `script-src`; see the CSP notes in the README.
 */
export const PREFS_BOOTSTRAP_SCRIPT =
  `(function(){var d=document.documentElement,p={};` +
  // Reading is fenced off on its own: a corrupt mirror must not skip the
  // defaults below, which is what a single try block around everything did.
  `try{p=JSON.parse(localStorage.getItem(${JSON.stringify(PREFS_KEY)})||"null")||{}}catch(e){}` +
  // `auto` is resolved here rather than in CSS so the rest of the stylesheet
  // has exactly one place to key off. Fenced off for the same reason as the
  // read above: `matchMedia` is missing in some environments, and one throw
  // must not cost the reader their accent and reading size as well.
  `try{var t=p.theme||${JSON.stringify(DEFAULT_PREFS.theme)};` +
  `if(t==="auto")t=(window.matchMedia&&matchMedia("(prefers-color-scheme: light)").matches)?"parchment":"palace";` +
  `d.dataset.theme=t}catch(e){d.dataset.theme=${JSON.stringify(DEFAULT_PREFS.theme)}}` +
  `try{d.dataset.accent=p.accent||${JSON.stringify(DEFAULT_PREFS.accent)};` +
  `d.dataset.textSize=p.textSize||${JSON.stringify(DEFAULT_PREFS.textSize)};` +
  `d.dataset.reduceMotion=p.reduceMotion?"true":"false"}catch(e){}})()`;
