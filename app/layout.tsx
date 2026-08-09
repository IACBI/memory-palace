import type { Metadata, Viewport } from "next";
import { Instrument_Sans, Syne } from "next/font/google";
import "./globals.css";
import { StoreProvider } from "@/components/providers/StoreProvider";
import { AppShell } from "@/components/shell/AppShell";
import { DEFAULT_PREFS, PREFS_BOOTSTRAP_SCRIPT } from "@/lib/prefs";
import { metaContentSecurityPolicy } from "@/lib/security-headers";

/**
 * Syne carries the headings and nothing else.
 *
 * It is a wide, architectural grotesque — the letterforms take up room, which
 * is the whole argument for using it in an app about placing things in space.
 * It is also eccentric enough to be tiring below about 20px, so it is confined
 * to page titles, the brand and the large counts; everything the reader
 * actually reads is set in Instrument Sans, a narrower grotesque that stays
 * quiet at 13–16px.
 *
 * Both faces are variable, so neither ships a weight the app never uses.
 */
const display = Syne({
  variable: "--font-display",
  subsets: ["latin"],
  display: "swap",
});

const sans = Instrument_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

/**
 * The demo is served from a project subpath on GitHub Pages; anything absolute
 * (Open Graph images, canonical URLs) has to resolve against that origin.
 */
const BASE_PATH = process.env.GITHUB_PAGES ? "/memory-palace" : "";
const SITE_URL = process.env.GITHUB_PAGES
  ? `https://iacbi.github.io${BASE_PATH}`
  : "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Memory Palace",
    template: "%s · Memory Palace",
  },
  description: "A spatial home for everything you know.",
  applicationName: "Memory Palace",
  authors: [{ name: "𝓐.𝓒.𝓑" }],
  keywords: [
    "memory palace",
    "method of loci",
    "spatial notes",
    "knowledge graph",
    "local-first",
  ],
  // Declared explicitly rather than left to the `app/icon.tsx` file
  // convention: Next emits that link as a root-relative `/icon`, without the
  // base path, which 404s on a project-subpath deployment. Every other asset
  // URL it generates is prefixed correctly.
  icons: {
    icon: [{ url: `${BASE_PATH}/icon`, type: "image/png", sizes: "64x64" }],
  },
  openGraph: {
    type: "website",
    siteName: "Memory Palace",
    title: "Memory Palace",
    description: "A spatial home for everything you know.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Memory Palace",
    description: "A spatial home for everything you know.",
  },
};

export const viewport: Viewport = {
  // The browser chrome follows the theme. These are the system-preference
  // colours — --palace-base in each theme; the in-app override is applied by
  // CSS `color-scheme` on :root.
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f1ece3" },
    { media: "(prefers-color-scheme: dark)", color: "#0f0f11" },
  ],
  colorScheme: "dark light",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      // The inline script below rewrites these before the first paint, so the
      // server markup and the painted DOM legitimately differ.
      suppressHydrationWarning
      data-accent={DEFAULT_PREFS.accent}
      data-text-size={DEFAULT_PREFS.textSize}
      data-reduce-motion="false"
      className={`${display.variable} ${sans.variable} h-full antialiased`}
    >
      <head>
        {/*
          The static export cannot send headers, so the policy travels in the
          document. `frame-ancestors` is omitted because meta-form CSP ignores
          it — the server build carries it as a real header.
        */}
        <meta
          httpEquiv="Content-Security-Policy"
          content={metaContentSecurityPolicy()}
        />
        <script
          // Applies the saved accent, reading size and motion preference while
          // the browser is still parsing <head>. Without it, un-gating the app
          // would flash the default theme on every hard load.
          dangerouslySetInnerHTML={{ __html: PREFS_BOOTSTRAP_SCRIPT }}
        />
      </head>
      <body className="min-h-full bg-ground text-text">
        <StoreProvider>
          <AppShell>{children}</AppShell>
        </StoreProvider>
      </body>
    </html>
  );
}
