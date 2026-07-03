import swc from "unplugin-swc";
import { defineConfig } from "vitest/config";

// Nest's WebSocket gateways read decorator metadata (`design:paramtypes`, emitted by
// `emitDecoratorMetadata`) that vitest's default esbuild transform does NOT emit. SWC (with
// legacy decorators + metadata) does, so we transform the whole module tree through it.
// `test/setup.ts` polyfills `reflect-metadata` first. The environment stays `node`; the React
// CLIENT test (`02-use-socket`) opts into jsdom with a `// @vitest-environment jsdom` first line.
//
// Because SWC (not esbuild) owns the transform, JSX must be configured HERE: the parser accepts
// both `tsx` and legacy `decorators`, and `transform.react.runtime = "automatic"` emits the
// `react/jsx-runtime` import so `.tsx` tests need no `import React`. `legacyDecorator` +
// `decoratorMetadata` keep the Nest gateway metadata that the default (tsconfig-derived) config
// would otherwise supply.
export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    setupFiles: ["./test/setup.ts"],
  },
  plugins: [
    swc.vite({
      jsc: {
        parser: { syntax: "typescript", tsx: true, decorators: true },
        transform: {
          legacyDecorator: true,
          decoratorMetadata: true,
          react: { runtime: "automatic" },
        },
      },
      module: { type: "es6" },
    }),
  ],
});
