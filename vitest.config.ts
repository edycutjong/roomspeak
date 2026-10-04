import { defineConfig } from "vitest/config";

// Unit, regression and property tests only. The Playwright specs in e2e/ run with `npm run e2e`.
// `npm run coverage` reports on all app source, not just the files the tests happen to import.
export default defineConfig({
  test: {
    include: ["tests/**/*.test.ts"],
    coverage: { provider: "v8", include: ["src/**", "shared/**", "api/**"], reporter: ["text", "html"] },
  },
});
