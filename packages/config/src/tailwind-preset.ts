import type { Config } from "tailwindcss";

/**
 * Shared Tailwind preset (design tokens). Both apps and packages/ui extend this so
 * the whole monorepo shares one theme. Real tokens land in module 11.
 */
const preset: Omit<Config, "content"> = {
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#4f46e5",
          fg: "#ffffff",
        },
      },
      borderRadius: { xl: "0.75rem" },
    },
  },
  darkMode: "class",
};

export default preset;
