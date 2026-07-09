import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/client/client.js";

// Prisma 7 dropped the client's automatic .env loading — restore it for the repo-root
// .env so `import { db }` stays plug-and-play. Real environment variables always win
// (`process.loadEnvFile` never overrides existing vars); a missing file is fine (CI
// sets DATABASE_URL directly).
const rootEnv = fileURLToPath(new URL("../../../.env", import.meta.url));
if (existsSync(rootEnv)) process.loadEnvFile(rootEnv);

/**
 * A single shared PrismaClient. Importing `{ db }` everywhere avoids opening a new pool
 * per module; in dev we stash it on globalThis so HMR doesn't leak connections.
 * Prisma 7 is Rust-free: the client talks to Postgres through the `pg` driver adapter
 * (no connection is opened until the first query runs).
 */
const globalForDb = globalThis as unknown as { db?: PrismaClient };

export const db =
  globalForDb.db ??
  new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
  });

if (process.env.NODE_ENV !== "production") globalForDb.db = db;

export * from "../generated/client/client.js";
