import type { Config } from "tailwindcss";
import preset from "@learn-fullstack/config/tailwind-preset";

/**
 * Extends the shared monorepo preset (design tokens) so the app, `@learn-fullstack/ui`, and
 * every package share one theme. `content` globs the app source plus the shared UI package so
 * Tailwind keeps the classes those components emit.
 */
const config: Config = {
  presets: [preset],
  content: [
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
    "../../packages/ui/src/**/*.{ts,tsx}",
  ],
};

export default config;
