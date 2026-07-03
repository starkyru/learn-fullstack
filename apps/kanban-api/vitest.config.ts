import swc from "unplugin-swc";
import { defineConfig } from "vitest/config";

// Nest's DI + code-first GraphQL read decorator metadata (`design:paramtypes`) that vitest's default
// esbuild transform does NOT emit. SWC does — `unplugin-swc` reads `tsconfig.json` and turns on legacy
// decorators + `emitDecoratorMetadata` automatically — so we transform the whole app tree through it.
// This is a pure GraphQL API (no React), so the node environment is correct. `test/setup.ts` polyfills
// `reflect-metadata` FIRST so Nest's DI container can read the emitted metadata.
export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    setupFiles: ["./test/setup.ts"],
  },
  plugins: [swc.vite({ module: { type: "es6" } })],
});
