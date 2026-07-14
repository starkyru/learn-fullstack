/**
 * Policy for whether the GraphQL dev tooling (the GraphiQL explorer + schema introspection) is
 * exposed. **Default-deny:** it is enabled only for an explicit `development`/`test` environment.
 * Every other value — `production`, `staging`, a typo like `prod`, uppercase, whitespace, AND an
 * unset/empty `NODE_ENV` — returns false, so a deployment that merely forgets to set `NODE_ENV`
 * never exposes the explorer or the schema.
 *
 * Pure (env passed in explicitly — no `process.env` default, so a unit test can assert the `undefined`
 * case directly). `pnpm --filter @learn-fullstack/kanban-api dev` sets `NODE_ENV=development` (see
 * package.json) so local dev still gets the explorer; the Vitest run sets `NODE_ENV=test`.
 */
export function graphqlDevToolsEnabled(nodeEnv: string | undefined): boolean {
  return nodeEnv === "development" || nodeEnv === "test";
}
