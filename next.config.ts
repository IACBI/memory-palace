import type { NextConfig } from "next";

/**
 * The GitHub Pages demo is a fully static export served from a project
 * subpath (https://<user>.github.io/memory-palace/). That build is opted in
 * with `GITHUB_PAGES=true` (set by the deploy workflow) so local `next dev`
 * and a normal `next build` keep their default, server-capable behaviour.
 */
const isGithubPages = process.env.GITHUB_PAGES === "true";
const repoBasePath = "/memory-palace";

const nextConfig: NextConfig = isGithubPages
  ? {
      output: "export",
      basePath: repoBasePath,
      trailingSlash: true,
      images: { unoptimized: true },
    }
  : {};

export default nextConfig;
