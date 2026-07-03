// @ts-check

/**
 * Next.js App Router config. Transpiles the workspace packages the app consumes so their
 * TS/JSX is compiled by Next rather than shipped as-is. Artifact only — NOT part of the
 * typecheck/vitest gate (we never run `next build` at gate time).
 *
 * @type {import("next").NextConfig}
 */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: [
    "@learn-fullstack/ui",
    "@learn-fullstack/shared",
    "@learn-fullstack/config",
  ],
};

export default nextConfig;
