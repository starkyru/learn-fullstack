export { makeUser } from "./factories.js";

import { PostgreSqlContainer } from "@testcontainers/postgresql";

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
