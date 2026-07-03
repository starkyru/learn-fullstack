import swc from "unplugin-swc";
import { defineConfig } from "vitest/config";

// Nest's DI reads decorator metadata that vitest's default esbuild transform does NOT
// emit. SWC (with legacy decorators + `emitDecoratorMetadata`) does, so we transform the
// whole module tree through it. `test/setup.ts` polyfills `reflect-metadata` first.
export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    setupFiles: ["./test/setup.ts"],
  },
  plugins: [swc.vite({ module: { type: "es6" } })],
});
