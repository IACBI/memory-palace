import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // Resolves the `@/*` alias from tsconfig.json. Vite supports this natively
  // now; the `vite-tsconfig-paths` plugin the Next.js guide suggests is no
  // longer needed and warns on startup.
  resolve: { tsconfigPaths: true },
  test: {
    environment: "jsdom",
    setupFiles: ["./test/setup.ts"],
    include: ["test/**/*.test.{ts,tsx}"],
    coverage: {
      provider: "v8",
      include: ["lib/**/*.ts"],
      // Seed data is 400 lines of literals; the storage adapter's browser
      // branches are covered through the fake-Storage tests that target it.
      exclude: ["lib/seed-data.ts"],
      reporter: ["text", "lcov"],
    },
  },
});
