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
  palace: { label: "Palace", hint: "Lamplit dark" },
  parchment: { label: "Parchment", hint: "Warm daylight" },
};

/**
 * The accent picker's dots and names.
 *
 * The keys are storage identifiers and never change — they are persisted in
 * every saved palace. The labels and swatches describe what the accent
 * currently *looks like*, so they do change when the palette is re-hued, and
 * the two are allowed to disagree — `brass` was labelled "Periwinkle"
 * throughout the Observatory identity, because naming a dot "Brass" while
 * painting it blue is the one thing that would actually confuse someone.
 *
 * Under Eşik all four happen to match their keys again. That is a coincidence
 * of this repaint, not a rule to start relying on: re-hue the values freely
 * and rename the labels to follow, but never rename a key.
 *
 * `swatch` must track `--palace-accent` for that key in the dark theme (see
 * `app/globals.css`); it is a literal because this renders as an inline style
 * on a control that has no `[data-accent]` of its own to inherit from.
 */
export const ACCENT_META: Record<AccentKey, { label: string; swatch: string }> =
  {
    brass: { label: "Brass", swatch: "#f0b775" },
    copper: { label: "Copper", swatch: "#f0a05e" },
    sage: { label: "Sage", swatch: "#8fd3ba" },
    slate: { label: "Slate", swatch: "#b0bccd" },
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
