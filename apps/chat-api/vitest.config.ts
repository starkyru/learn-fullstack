import swc from "unplugin-swc";
import { defineConfig } from "vitest/config";

// Nest's DI + WS gateways read decorator metadata (`design:paramtypes`, emitted by
// `emitDecoratorMetadata`) that vitest's default esbuild transform does NOT emit. SWC (with
// legacy decorators + metadata) does, so we transform the whole module tree through it.
// `test/setup.ts` polyfills `reflect-metadata` first. Environment is `node` — this is an API.
export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    setupFiles: ["./test/setup.ts"],
  },
  plugins: [
    swc.vite({
      jsc: {
        parser: { syntax: "typescript", decorators: true },
        transform: {
          legacyDecorator: true,
          decoratorMetadata: true,
        },
      },
      module: { type: "es6" },
    }),
  ],
});
