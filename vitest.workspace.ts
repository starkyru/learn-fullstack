import { defineWorkspace } from "vitest/config";

// Aggregates every package's own Vitest config so `pnpm vitest` runs them all.
export default defineWorkspace(["packages/*", "modules/*", "apps/*"]);
