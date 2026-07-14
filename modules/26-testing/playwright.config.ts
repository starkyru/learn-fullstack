/**
 * ARTIFACT — Playwright config (Task 4). The GATE never runs this: it lives at the module root,
 * outside tsconfig `include` and vitest `include`, and requires a real browser + a running app.
 * It documents how the shipped `e2e/card-flow.spec.ts` would run in CI.
 *
 * Run manually with: `pnpm exec playwright install chromium && pnpm exec playwright test`.
 */
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://localhost:3000",
    trace: "on-first-retry",
  },
  webServer: {
    command: "pnpm --filter @learn-fullstack/kanban-web dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
