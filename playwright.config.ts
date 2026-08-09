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

/**
 * Ports, overridable for local runs.
 *
 * `reuseExistingServer` is on outside CI, so whatever already answers on these
 * ports is what the suite tests. When another project's dev server holds 3000,
 * every `server` test fails against a stranger's HTML and reads as ~85 product
 * bugs. Overriding the port sidesteps that without stopping someone else's
 * work: `PW_SERVER_PORT=3100 npx playwright test`. CI passes neither and keeps
 * the defaults.
 */
const SERVER_PORT = process.env.PW_SERVER_PORT ?? "3000";
const EXPORT_PORT = process.env.PW_EXPORT_PORT ?? "4173";

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
      use: {
        ...devices["Desktop Chrome"],
        baseURL: `http://localhost:${SERVER_PORT}/`,
      },
    },
    {
      name: "export",
      use: {
        ...devices["Desktop Chrome"],
        baseURL: `http://localhost:${EXPORT_PORT}/memory-palace/`,
      },
    },
  ],

  webServer: [
    {
      command: `npm run start -- --port ${SERVER_PORT}`,
      url: `http://localhost:${SERVER_PORT}`,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
    {
      command: `npm run serve:export -- --port ${EXPORT_PORT}`,
      url: `http://localhost:${EXPORT_PORT}/memory-palace/`,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
  ],
});
