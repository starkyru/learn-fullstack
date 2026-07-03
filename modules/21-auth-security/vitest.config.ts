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
    // RSA keygen + bcrypt work here is CPU-heavy and slow on 2-core CI runners; give the
    // real-crypto tests headroom over the 5s default so they don't flake on a slow keygen.
    testTimeout: 15000,
  },
  plugins: [swc.vite({ module: { type: "es6" } })],
});
