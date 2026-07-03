import js from "@eslint/js";
import tseslint from "typescript-eslint";
import globals from "globals";

/** Shared flat ESLint config (base). Not type-checked (keeps it fast + green). */
export const base = tseslint.config(
  { ignores: ["**/dist/**", "**/.next/**", "**/coverage/**", "**/storybook-static/**"] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: { globals: { ...globals.node } },
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/no-explicit-any": "warn",
    },
  },
);

export default base;
