import swc from "unplugin-swc";
import { defineConfig } from "vitest/config";

// Task 4 wires a real Nest module, whose DI reads decorator metadata that vitest's default
// esbuild transform does NOT emit. SWC (with legacy decorators + `emitDecoratorMetadata`)
// does, so we transform the whole module tree through it — the plain jose/bcrypt/OWASP tasks
// pass through SWC unchanged. `test/setup.ts` polyfills `reflect-metadata` first.
export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    setupFiles: ["./test/setup.ts"],
  },
  plugins: [swc.vite({ module: { type: "es6" } })],
});
