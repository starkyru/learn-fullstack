import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { defineConfig } from "prisma/config";

// Prisma 7 no longer auto-loads .env files — load the repo-root one explicitly.
// Real environment variables always win (`process.loadEnvFile` never overrides
// existing vars) and a missing file is fine (CI sets DATABASE_URL directly).
const rootEnv = fileURLToPath(new URL("../../.env", import.meta.url));
if (existsSync(rootEnv)) process.loadEnvFile(rootEnv);

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx src/seed.ts",
  },
  datasource: {
    // Read via process.env (not the throwing `env()` helper) so commands that never
    // touch the DB — e.g. `prisma generate` on a fresh clone without a .env — still run.
    // The fallback mirrors .env.example / docker-compose.
    url:
      process.env.DATABASE_URL ??
      "postgresql://dev:dev@localhost:5432/learn_fullstack?schema=public",
  },
});
