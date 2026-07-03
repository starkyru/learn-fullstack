import { base } from "@learn-fullstack/eslint-config";

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
];
