// @ts-check
import { fileURLToPath } from "node:url";

/**
 * Next.js App Router config. Transpiles the workspace packages the app consumes so their
 * TS/JSX is compiled by Next rather than shipped as-is. Artifact only — NOT part of the
 * typecheck/vitest gate (we never run `next build` at gate time).
 *
 * @type {import("next").NextConfig}
 */
const nextConfig = {
  reactStrictMode: true,
  // Pin file tracing to the monorepo root — otherwise Next walks up past it and can pick a
  // stray lockfile in the home directory as the workspace root.
  outputFileTracingRoot: fileURLToPath(new URL("../..", import.meta.url)),
  transpilePackages: [
    "@learn-fullstack/ui",
    "@learn-fullstack/shared",
    "@learn-fullstack/config",
  ],
  // Source uses NodeNext-style `.js` import specifiers (tsconfig `moduleResolution: Bundler`
  // maps them to the real `.ts`/`.tsx`). Teach webpack the same mapping so `next build` resolves
  // them the way the typecheck does.
  webpack: (config) => {
    config.resolve.extensionAlias = {
      ".js": [".ts", ".tsx", ".js"],
      ".jsx": [".tsx", ".jsx"],
    };
    return config;
  },
};

export default nextConfig;
