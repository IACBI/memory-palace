import { defineConfig, devices } from "@playwright/test";

/**
 * Two projects on purpose:
 *
 * - `server` runs against `next start`, the default server-capable build.
 * - `export` runs against the `GITHUB_PAGES=true` static export served from
 *   `out/` under its `/memory-palace` base path — the artifact that actually
 *   ships. Export-only breakage (base-path-relative URLs, anything that needs
 *   a server) is invisible to the `server` project.
 *
 * `npm run test:e2e` builds the export first and the server build second, so
 * both `out/` and `.next` are present and valid when the servers start.
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",

  /**
   * Above Playwright's 30s default.
   *
   * Every test gets a fresh context, and a fresh context installs the service
   * worker, which precaches the shell — the app's whole JavaScript payload.
   * With several workers doing that at once against a single-threaded static
   * server, a page load that takes a moment locally is not a product problem
   * and should not be reported as one.
   */
  timeout: 60_000,

  use: {
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },

  projects: [
    // Both base URLs end in a slash so specs can navigate with relative paths
    // (`./palace/`) and resolve correctly under the export's base path.
    {
      name: "server",
      use: { ...devices["Desktop Chrome"], baseURL: "http://localhost:3000/" },
    },
    {
      name: "export",
      use: {
        ...devices["Desktop Chrome"],
        baseURL: "http://localhost:4173/memory-palace/",
      },
    },
  ],

  webServer: [
    {
      command: "npm run start",
      url: "http://localhost:3000",
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
    {
      command: "npm run serve:export",
      url: "http://localhost:4173/memory-palace/",
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
  ],
});
