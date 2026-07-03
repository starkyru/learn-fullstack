import { defineConfig } from "vitest/config";

export default defineConfig({
  // Containers/migrations are slow; `prisma db push` runs in beforeAll, so the
  // per-file test + hook timeouts are bumped well past Vitest's 5s default.
  test: {
    environment: "node",
    globals: true,
    testTimeout: 60000,
    hookTimeout: 60000,
  },
});
