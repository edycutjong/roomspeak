import { defineConfig } from "@playwright/test";

// Browser specs (e2e/*.spec.ts) run against the production build served by `vite preview`.
// Each spec stubs /api/detect and the device voice, so they need no API key and never call an AI provider.
// Set BASE_URL (e.g. https://roomspeak.edycu.dev after a deploy) to run the same specs against a live site instead.
// The older e2e/slice*.mjs scripts are plain Playwright scripts for the dev server; see the README.
const live = process.env.BASE_URL;

export default defineConfig({
  testDir: "e2e",
  testMatch: "*.spec.ts",
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: live ?? "http://localhost:4173",
    viewport: { width: 390, height: 844 },
    trace: "on-first-retry",
  },
  webServer: live
    ? undefined
    : {
        command: "npm run preview -- --port 4173 --strictPort",
        url: "http://localhost:4173",
        reuseExistingServer: !process.env.CI,
      },
});
