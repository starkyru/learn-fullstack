import swc from "unplugin-swc";
import { defineConfig } from "vitest/config";

// This module is the trophy: it touches every test tier at once, so ONE config must serve
// pure-node reducers, jsdom React tests (per-file `// @vitest-environment jsdom`), and a Nest
// integration test. Nest's DI reads decorator metadata that vitest's default esbuild transform
// does NOT emit, so the whole tree goes through SWC (legacy decorators + `emitDecoratorMetadata`).
// `react: { runtime: "automatic" }` lets the `.tsx` files use JSX without importing React.
// `test/setup.ts` polyfills `reflect-metadata` first, then wires jest-dom matchers.
export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    setupFiles: ["./test/setup.ts"],
    include: ["test/**/*.test.{ts,tsx}"],
    // Task 3 spins a real Postgres container (Testcontainers) — give it room.
    testTimeout: 60000,
  },
  plugins: [
    swc.vite({
      module: { type: "es6" },
      jsc: {
        transform: {
          legacyDecorator: true,
          decoratorMetadata: true,
          react: { runtime: "automatic" },
        },
      },
    }),
  ],
});
