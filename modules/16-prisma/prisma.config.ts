import { defineConfig } from "prisma/config";

// Module-local Prisma 7 config: the CLI reads the schema path and datasource URL
// from here (the CLI no longer auto-loads .env files).
export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    // Only `prisma db push` needs this. The test harness sets DATABASE_URL to a
    // per-file temp SQLite file; the fallback covers manual experimentation.
    url: process.env.DATABASE_URL ?? "file:./prisma/dev.db",
  },
});
