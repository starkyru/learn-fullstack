import { defineConfig } from "vitest/config";

export default defineConfig({
  // Override PostCSS discovery so Vitest never loads `postcss.config.mjs` (a `next dev`/`next
  // build` artifact that pulls in tailwindcss/autoprefixer). Tests assert on roles/text/testids,
  // never on class names, so leaving CSS unprocessed is correct and keeps the gate self-contained.
  css: { postcss: { plugins: [] } },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./test/setup.ts"],
  },
});
