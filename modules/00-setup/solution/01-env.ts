import { loadEnv } from "@learn-fullstack/config";

export function readAppConfig() {
  const env = loadEnv();
  return { isProd: env.NODE_ENV === "production", databaseUrl: env.DATABASE_URL };
}

export function requireEnv(key: string, source: NodeJS.ProcessEnv = process.env): string {
  const value = source[key];
  if (value === undefined || value === "")
    throw new Error(`Missing required env: ${key}`);
  return value;
}
