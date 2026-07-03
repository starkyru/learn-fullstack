import { defineConfig } from "vitest/config";

// jsdom because this is the web SPA (DOM rendering via React Testing Library). Vitest's default
// esbuild transform handles `.tsx` with the automatic JSX runtime (tsconfig `jsx: react-jsx`), so
// no plugin is needed — the store/slice/view are plain React + RTK, no decorators. CSS Modules are
// left unprocessed by Vitest (imports resolve to an empty object), which is fine: tests assert on
// roles/text/testids, never on class names. Each render is torn down in `afterEach` (cleanup).
export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./test/setup.ts"],
  },
});
