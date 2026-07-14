import { base } from "@learn-fullstack/eslint-config";
import nextPlugin from "@next/eslint-plugin-next";

export default [
  ...base,
  {
    // Learner exercise stubs intentionally reference imports/params they haven't wired up
    // yet (worked-example + analog pattern). Solutions and tests are still fully linted.
    files: ["modules/*/src/**"],
    rules: {
      "@typescript-eslint/no-unused-vars": "off",
      // stub generators throw before yielding — that's the exercise, not a mistake
      "require-yield": "off",
    },
  },
  {
    // Keep the production Next app on Next's own rules as well as the shared TS baseline.
    files: ["apps/kanban-web/**/*.{js,jsx,ts,tsx}"],
    plugins: { "@next/next": nextPlugin },
    settings: { next: { rootDir: "apps/kanban-web/" } },
    rules: nextPlugin.configs.recommended.rules,
  },
];
