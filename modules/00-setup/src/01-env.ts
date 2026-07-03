import { loadEnv } from "@learn-fullstack/config";

/**
 * WORKED EXAMPLE (reference, fully implemented) — read the whole environment through the
 * shared contract instead of poking at process.env directly.
 */
export function readAppConfig() {
  const env = loadEnv();
  return { isProd: env.NODE_ENV === "production", databaseUrl: env.DATABASE_URL };
}

/**
 * YOUR TURN (analog) — return the value of a single required env var, throwing a readable
 * error if it is missing. Mirror the shape of the worked example above.
 * Signature: (key: string, source?: NodeJS.ProcessEnv) => string
 * Contract: return the value; a missing OR empty-string value must throw
 * `Missing required env: <key>`. Treat "" as missing.
 */
export function requireEnv(
  _key: string,
  _source: NodeJS.ProcessEnv = process.env,
): string {
  throw new Error("TODO: implement requireEnv (see steps above)");
}
