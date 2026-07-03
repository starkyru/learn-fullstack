import { PrismaClient } from "@prisma/client";

/**
 * A single shared PrismaClient. Importing `{ db }` everywhere avoids opening a new pool
 * per module; in dev we stash it on globalThis so HMR doesn't leak connections.
 */
const globalForDb = globalThis as unknown as { db?: PrismaClient };

export const db = globalForDb.db ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForDb.db = db;

export * from "@prisma/client";
