import type { MetadataRoute } from "next";

export const dynamic = "force-static";

/**
 * Only the fixed routes. `/room` is intentionally omitted: it is meaningless
 * without a `?r=<id>` that exists solely in the visitor's own browser.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const routes = ["", "/palace", "/library", "/graph", "/settings"];
  const lastModified = new Date();

  return routes.map((route) => ({
    url: `https://iacbi.github.io/memory-palace${route}`,
    lastModified,
    changeFrequency: "monthly",
    priority: route === "" ? 1 : 0.7,
  }));
}
