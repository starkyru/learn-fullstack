import swc from "unplugin-swc";
import { defineConfig } from "vitest/config";

// This module mixes a NestJS GraphQL server AND a React client. Nest's DI + code-first GraphQL read
// decorator metadata (`design:paramtypes`) that vitest's default esbuild transform does NOT emit.
// SWC does — `unplugin-swc` reads `tsconfig.json` and turns on legacy decorators + `emitDecoratorMetadata`
// automatically — so we transform the whole module tree through it. It also enables `.tsx` parsing,
// but SWC's JSX transform defaults to the CLASSIC runtime (needs `React` in scope); the `jsc.transform.react`
// override below switches it to the AUTOMATIC runtime (merged OVER the tsconfig-derived config), so the
// `.tsx` client files need no `import React`. Server tests run in the default `node` environment; each
// React CLIENT test file opts into jsdom via a `// @vitest-environment jsdom` comment on its first line.
// `test/setup.ts` polyfills `reflect-metadata` (Nest/GraphQL) and `@testing-library/jest-dom` (client).
export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    setupFiles: ["./test/setup.ts"],
  },
  plugins: [
    swc.vite({
      module: { type: "es6" },
      jsc: { transform: { react: { runtime: "automatic" } } },
    }),
  ],
});
