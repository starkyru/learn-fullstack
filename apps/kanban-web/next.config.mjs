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
