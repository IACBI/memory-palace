/**
 * The app's security policy, in one place.
 *
 * It has to be expressed twice because the two deployment targets differ:
 *
 * - The **server build** sends real headers, which is the only way to get
 *   `frame-ancestors` and `X-Frame-Options` enforced.
 * - The **static export** cannot send headers at all — `headers()` is listed
 *   under unsupported features for `output: "export"` — so it ships a
 *   `<meta http-equiv>` instead. Meta-form CSP ignores `frame-ancestors`, so
 *   clickjacking protection is genuinely absent on GitHub Pages. That is
 *   documented rather than papered over.
 *
 * `'unsafe-inline'` in `script-src` is unavoidable here: Next's own RSC
 * bootstrap emits inline `self.__next_f.push(...)` scripts, and the theme
 * bootstrap in the root layout has to run before first paint. Nonces are the
 * documented alternative but force every page to render dynamically, which
 * this app cannot do.
 */
const DIRECTIVES: Array<[string, string]> = [
  ["default-src", "'self'"],
  // No remote scripts of any kind; see the note above on 'unsafe-inline'.
  ["script-src", "'self' 'unsafe-inline'"],
  // Tailwind and the palette write inline style attributes.
  ["style-src", "'self' 'unsafe-inline'"],
  // Fonts are self-hosted by next/font; data: covers the SVG noise textures.
  ["img-src", "'self' data: blob:"],
  ["font-src", "'self'"],
  // The app is entirely local-first: it never talks to a server.
  ["connect-src", "'self'"],
  // The offline service worker. Both of these fall back to `default-src`, but
  // stating them keeps the policy readable as a description of the app.
  ["worker-src", "'self'"],
  ["manifest-src", "'self'"],
  ["object-src", "'none'"],
  ["base-uri", "'self'"],
  ["form-action", "'self'"],
  ["frame-ancestors", "'none'"],
  ["upgrade-insecure-requests", ""],
];

/** The CSP as a single header value. */
export function contentSecurityPolicy(): string {
  return DIRECTIVES.map(([name, value]) =>
    value ? `${name} ${value}` : name,
  ).join("; ");
}

/**
 * The subset expressible in a `<meta http-equiv>` tag.
 *
 * `frame-ancestors` is ignored in meta form, so it is dropped rather than left
 * in to imply a protection that is not there.
 */
export function metaContentSecurityPolicy(): string {
  return DIRECTIVES.filter(([name]) => name !== "frame-ancestors")
    .map(([name, value]) => (value ? `${name} ${value}` : name))
    .join("; ");
}

/** Response headers for the server-capable build. */
export function securityHeaders(): Array<{ key: string; value: string }> {
  return [
    { key: "Content-Security-Policy", value: contentSecurityPolicy() },
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "X-Frame-Options", value: "DENY" },
    { key: "Referrer-Policy", value: "no-referrer" },
    {
      key: "Permissions-Policy",
      value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
    },
  ];
}
