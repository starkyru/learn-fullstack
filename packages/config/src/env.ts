import { z } from "zod";

/**
 * The runtime environment contract for every app/service in the monorepo.
 * `loadEnv()` parses `process.env` once and fails fast with a readable error if a
 * required variable is missing or malformed — so a misconfigured deploy dies at
 * boot, not deep in a request.
 */
export const EnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z.string().url(),
  AUTH_SECRET: z.string().min(32),
  JWT_SECRET: z.string().min(32),
  REDIS_URL: z.string().url().optional(),
});

export type Env = z.infer<typeof EnvSchema>;

export function loadEnv(source: NodeJS.ProcessEnv = process.env): Env {
  const parsed = EnvSchema.safeParse(source);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `  - ${i.path.join(".") || "(root)"}: ${i.message}`)
      .join("\n");
    throw new Error(`Invalid environment:\n${issues}`);
  }
  return parsed.data;
}
