import { defineConfig } from "vitest/config";

// Default is node; the React/RTL test opts in per-file with `// @vitest-environment jsdom`.
export default defineConfig({
  test: { environment: "node", globals: true, setupFiles: ["./test/setup.ts"] },
});
