export { makeUser } from "./factories.js";

import { execSync } from "node:child_process";
import { PostgreSqlContainer } from "@testcontainers/postgresql";

let dockerProbe: boolean | undefined;

/**
 * Is a Docker daemon reachable? Container-backed tests (Testcontainers) gate on this so a local
 * run without Docker SKIPS them instead of erroring — while CI, which always has Docker, still
 * runs them for real.
 *
 * - In CI (`process.env.CI` set) returns `true` unconditionally: CI must never silently skip the
 *   integration suite because of a transient daemon hiccup — if Docker is broken there, let the
 *   tests fail loudly.
 * - Otherwise probes `docker info` once (result cached) and warns when the daemon is unreachable.
 *
 *   const dockerUp = hasDocker();
 *   describe.skipIf(!dockerUp)("integration", () => { ... });
 */
export function hasDocker(): boolean {
  if (dockerProbe !== undefined) return dockerProbe;
  if (process.env.CI) {
    dockerProbe = true;
    return dockerProbe;
  }
  try {
    execSync("docker info", { stdio: "ignore", timeout: 10_000 });
    dockerProbe = true;
  } catch {
    console.warn(
      "[hasDocker] Docker daemon not reachable — skipping container-backed tests. " +
        "Start Docker (or run in CI) to exercise them.",
    );
    dockerProbe = false;
  }
  return dockerProbe;
}

/**
 * Spins up a throwaway Postgres (Testcontainers) for integration/e2e tests, hands its connection
 * URL to `fn`, and tears the container down afterwards — even if `fn` throws. Each call is fully
 * isolated, so integration tests never share state or collide on a fixed database.
 *
 * Requires a running Docker daemon. The `postgres:16-alpine` image is pulled once and cached.
 *
 *   await withEphemeralPostgres(async (url) => {
 *     const client = new Client({ connectionString: url });
 *     await client.connect();
 *     // …run migrations, exercise queries, assert…
 *     await client.end();
 *   });
 */
export async function withEphemeralPostgres<T>(
  fn: (databaseUrl: string) => Promise<T>,
): Promise<T> {
  const container = await new PostgreSqlContainer("postgres:16-alpine").start();
  try {
    return await fn(container.getConnectionUri());
  } finally {
    await container.stop();
  }
}
