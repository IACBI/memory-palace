import type { AccentKey, PalaceSettings, TextSize } from '@/lib/types';

/** Accent themes, in display order. All muted and atmospheric — each is
 *  luminous enough to carry dark button text at WCAG AA. */
export const ACCENTS = ['brass', 'copper', 'sage', 'slate'] as const;

/** Reading sizes, in ascending order. */
export const TEXT_SIZES = ['small', 'medium', 'large'] as const;

export const ACCENT_META: Record<AccentKey, { label: string; swatch: string }> = {
  brass: { label: 'Brass', swatch: '#c9a227' },
  copper: { label: 'Copper', swatch: '#cf9560' },
  sage: { label: 'Sage', swatch: '#a3b58c' },
  slate: { label: 'Slate', swatch: '#aab6c6' },
};

export const TEXT_SIZE_META: Record<TextSize, { label: string }> = {
  small: { label: 'Small' },
  medium: { label: 'Medium' },
  large: { label: 'Large' },
};

/** The settings a fresh palace starts with. Every option has a sensible
 *  default so the app looks and works great for someone who changes nothing. */
export const DEFAULT_SETTINGS: PalaceSettings = {
  accent: 'brass',
  textSize: 'medium',
  reduceMotion: false,
  lastView: '/',
};

function isAccent(value: unknown): value is AccentKey {
  return (ACCENTS as readonly string[]).includes(value as string);
}

function isTextSize(value: unknown): value is TextSize {
  return (TEXT_SIZES as readonly string[]).includes(value as string);
}

/**
 * Fills any missing or unknown preference with its default. Keeps older
 * exports (which predate `accent`/`textSize`) fully importable.
 */
export function normalizeSettings(value: Partial<PalaceSettings> | null | undefined): PalaceSettings {
  return {
    accent: isAccent(value?.accent) ? value.accent : DEFAULT_SETTINGS.accent,
    textSize: isTextSize(value?.textSize) ? value.textSize : DEFAULT_SETTINGS.textSize,
    reduceMotion:
      typeof value?.reduceMotion === 'boolean'
        ? value.reduceMotion
        : DEFAULT_SETTINGS.reduceMotion,
    lastView:
      typeof value?.lastView === 'string' ? value.lastView : DEFAULT_SETTINGS.lastView,
  };
}
