/**
 * Schemes a stored link is allowed to use.
 *
 * React neutralises `javascript:` hrefs on its own, but the app should not
 * depend on a framework's internal guard for its only URL sanitisation — and
 * that guard covers neither `data:` nor `blob:` nor `vbscript:`. A palace can
 * arrive from an import file, which can come from anywhere.
 */
const SAFE_SCHEMES = new Set(["http:", "https:", "mailto:"]);

/** Matches C0 controls and DEL, which URL parsers silently strip. */
const CONTROL_CHARACTERS = /[\u0000-\u001F\u007F]/;

/**
 * Whether a stored URL is safe to put in an `href`.
 *
 * Answers the security question only. A value with no scheme (`example.com`)
 * is *safe* — it simply resolves against the app's own origin — but is
 * probably not what the user meant; see {@link normaliseHref}.
 */
export function isSafeHref(value: string | undefined): value is string {
  if (!value) return false;
  const trimmed = value.trim();
  if (trimmed === "") return false;

  // `java\tscript:` would otherwise normalise back into `javascript:`.
  if (CONTROL_CHARACTERS.test(trimmed)) return false;

  try {
    const parsed = new URL(trimmed, "https://memory-palace.invalid");
    return SAFE_SCHEMES.has(parsed.protocol);
  } catch {
    return false;
  }
}

/**
 * The href to actually navigate to, or `null` when the value is unsafe.
 *
 * Someone typing `example.com` into a link means the website, not a path
 * inside this app, so a scheme-less value that looks like a host is upgraded
 * to `https://`.
 */
export function normaliseHref(value: string | undefined): string | null {
  if (!isSafeHref(value)) return null;
  const trimmed = value.trim();
  if (/^[a-z][a-z0-9+.-]*:/i.test(trimmed)) return trimmed;
  // Bare hosts only — anything with a space or without a dot is left alone.
  return /^[^\s/]+\.[^\s/]+/.test(trimmed) ? `https://${trimmed}` : trimmed;
}
