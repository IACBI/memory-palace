import {
  ACCENT_KEYS,
  TEXT_SIZE_KEYS,
  THEME_KEYS,
  type AccentKey,
  type PalaceSettings,
  type TextSize,
  type ThemeKey,
} from "@/lib/types";

/** Accent themes, in display order. All muted and atmospheric — each is
 *  luminous enough to carry dark button text at WCAG AA. */
export const ACCENTS = ACCENT_KEYS;

/** Reading sizes, in ascending order. */
export const TEXT_SIZES = TEXT_SIZE_KEYS;

/** Surface themes, in display order. */
export const THEMES = THEME_KEYS;

export const THEME_META: Record<ThemeKey, { label: string; hint: string }> = {
  auto: { label: "Auto", hint: "Follow the system" },
  palace: { label: "Palace", hint: "Candlelit dark" },
  parchment: { label: "Parchment", hint: "Warm light" },
};

export const ACCENT_META: Record<AccentKey, { label: string; swatch: string }> =
  {
    brass: { label: "Brass", swatch: "#c9a227" },
    copper: { label: "Copper", swatch: "#cf9560" },
    sage: { label: "Sage", swatch: "#a3b58c" },
    slate: { label: "Slate", swatch: "#aab6c6" },
  };

export const TEXT_SIZE_META: Record<TextSize, { label: string }> = {
  small: { label: "Small" },
  medium: { label: "Medium" },
  large: { label: "Large" },
};

/** The settings a fresh palace starts with. Every option has a sensible
 *  default so the app looks and works great for someone who changes nothing. */
export const DEFAULT_SETTINGS: PalaceSettings = {
  theme: "palace",
  accent: "brass",
  textSize: "medium",
  reduceMotion: false,
};

function isTheme(value: unknown): value is ThemeKey {
  return (THEMES as readonly string[]).includes(value as string);
}

function isAccent(value: unknown): value is AccentKey {
  return (ACCENTS as readonly string[]).includes(value as string);
}

function isTextSize(value: unknown): value is TextSize {
  return (TEXT_SIZES as readonly string[]).includes(value as string);
}

/**
 * Fills any missing or unknown preference with its default.
 *
 * Builds a fresh object rather than spreading the input, so a key this version
 * no longer knows about — `lastView`, which was written and validated for a
 * year without anything ever reading it — is simply dropped. Older exports
 * stay importable either way.
 */
export function normalizeSettings(
  value: Partial<PalaceSettings> | null | undefined,
): PalaceSettings {
  return {
    theme: isTheme(value?.theme) ? value.theme : DEFAULT_SETTINGS.theme,
    accent: isAccent(value?.accent) ? value.accent : DEFAULT_SETTINGS.accent,
    textSize: isTextSize(value?.textSize)
      ? value.textSize
      : DEFAULT_SETTINGS.textSize,
    reduceMotion:
      typeof value?.reduceMotion === "boolean"
        ? value.reduceMotion
        : DEFAULT_SETTINGS.reduceMotion,
  };
}
