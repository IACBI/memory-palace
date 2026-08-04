import type { MetadataRoute } from "next";

// Baked at build time, like every other route in the static export.
export const dynamic = "force-static";

/**
 * The GitHub Pages demo lives at a project subpath. `start_url` and `scope`
 * are resolved by the browser against the manifest's own URL, but writing them
 * absolutely keeps the installed app pinned to this app rather than to the
 * whole github.io origin, which hosts every other project too.
 */
const BASE_PATH = process.env.GITHUB_PAGES ? "/memory-palace" : "";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Memory Palace",
    short_name: "Palace",
    description: "A spatial home for everything you know.",
    start_url: `${BASE_PATH}/`,
    scope: `${BASE_PATH}/`,
    display: "standalone",
    orientation: "any",
    background_color: "#121110",
    theme_color: "#121110",
    categories: ["productivity", "education"],
    icons: [
      {
        src: `${BASE_PATH}/icon-192.png`,
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: `${BASE_PATH}/icon-512.png`,
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: `${BASE_PATH}/icon-512.png`,
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
