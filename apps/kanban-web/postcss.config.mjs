/**
 * PostCSS pipeline for Tailwind. Artifact only — used by `next dev`/`next build`, not by the
 * typecheck/vitest gate.
 */
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
