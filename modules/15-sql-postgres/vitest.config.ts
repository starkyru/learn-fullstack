import { defineConfig } from "vitest/config";

// Containers + migrations are slow to spin up, so the DB tasks need generous
// per-test and per-hook budgets (a cold `postgres:16-alpine` pull + boot can
// take tens of seconds on the first run).
export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    testTimeout: 60000,
    hookTimeout: 60000,
  },
});
