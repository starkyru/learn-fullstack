import { defineConfig, configDefaults } from "vitest/config";

export default defineConfig({
  // Override PostCSS discovery so Vitest never loads `postcss.config.mjs` (a `next dev`/`next
  // build` artifact that pulls in tailwindcss/autoprefixer). Tests assert on roles/text/testids,
  // never on class names, so leaving CSS unprocessed is correct and keeps the gate self-contained.
  css: { postcss: { plugins: [] } },
  // The app's tsconfig extends Next's (`jsx: "preserve"`), which would make Vitest's esbuild fall
  // back to the classic runtime and require a `React` global these RSC/island files never import.
  // Force the automatic runtime so JSX compiles to `jsx()` imports, matching how Next builds it.
  esbuild: { jsx: "automatic" },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./test/setup.ts"],
    // `e2e/*.spec.ts` are Playwright tests, run by `pnpm test:e2e` (playwright.config.ts).
    // Vitest's default glob would otherwise collect them and throw "test() not expected here".
    exclude: [...configDefaults.exclude, "e2e/**"],
  },
});
