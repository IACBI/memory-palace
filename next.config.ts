import type { NextConfig } from "next";
import { securityHeaders } from "./lib/security-headers";

/**
 * The GitHub Pages demo is a fully static export served from a project
 * subpath (https://<user>.github.io/memory-palace/). That build is opted in
 * with `GITHUB_PAGES=true` (set by the deploy workflow) so local `next dev`
 * and a normal `next build` keep their default, server-capable behaviour.
 */
const isGithubPages = process.env.GITHUB_PAGES === "true";
const repoBasePath = "/memory-palace";

/**
 * Stamps the offline worker's cache, via the `?v=` on its registration URL.
 *
 * The commit sha in CI, a build timestamp locally. It has to change whenever
 * the output does: a service worker whose script bytes are identical is never
 * reinstalled, which is exactly how users end up pinned to an old build.
 */
const buildId =
  process.env.GITHUB_SHA?.slice(0, 12) ?? `dev-${Date.now().toString(36)}`;

const nextConfig: NextConfig = isGithubPages
  ? {
      output: "export",
      basePath: repoBasePath,
      trailingSlash: true,
      images: { unoptimized: true },
      env: {
        NEXT_PUBLIC_BUILD_ID: buildId,
        NEXT_PUBLIC_BASE_PATH: repoBasePath,
      },
      // `headers()` is a no-op under `output: "export"`; the static build gets
      // its policy from the <meta http-equiv> in the root layout instead.
      poweredByHeader: false,
    }
  : {
      poweredByHeader: false,
      env: { NEXT_PUBLIC_BUILD_ID: buildId, NEXT_PUBLIC_BASE_PATH: "" },
      async headers() {
        return [{ source: "/:path*", headers: securityHeaders() }];
      },
    };

export default nextConfig;
