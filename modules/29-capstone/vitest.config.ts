import { defineConfig } from "vitest/config";

// This capstone assembles the two apps' slices as PURE, framework-agnostic logic — a board
// service + optimistic runner, a JWT-guarded chat gateway over a faked transport, observability
// and readiness helpers. There are no Nest decorators, no React render, and no real sockets, so
// the default esbuild transform + a plain `node` environment are enough (no SWC, no jsdom).
export default defineConfig({
  test: { environment: "node", globals: true },
});
