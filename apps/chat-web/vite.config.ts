// Artifact for the real dev/build server — NOT part of the test gate and NOT typechecked
// (excluded from tsconfig `include`). Add `vite` + `@vitejs/plugin-react` before running `dev`.
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: { port: 5175 },
});
