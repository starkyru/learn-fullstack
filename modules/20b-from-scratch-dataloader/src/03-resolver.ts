import type { DataLoader, DataLoaderOptions } from "./02-cache-dedupe.js";

/**
 * Wire the from-scratch loader into a tiny "resolver", the way a GraphQL field resolver would use a
 * per-request DataLoader — then prove it matches the naive baseline.
 *
 * The fixtures (`USERS`, `makeUserBackend`) and the naive baseline (`resolveUsersNaive`) are given.
 *
 * YOUR TURN — implement the loader path:
 *   - createUserLoader(fetchUsers, options): build a `DataLoader<number, User>` over `fetchUsers`
 *     with `createDataLoader`.
 *   - resolveUsersWithLoader(loader, ids): fan the ids through the loader (`loadMany`) so the backend
 *     is called ONCE per tick regardless of count/repeats, returning the same per-index results as
 *     `resolveUsersNaive`.
 */

export interface User {
  id: number;
  name: string;
}

/** The in-memory table the backend reads from. */
export const USERS: readonly User[] = [
  { id: 1, name: "Ada" },
  { id: 2, name: "Linus" },
  { id: 3, name: "Grace" },
  { id: 4, name: "Alan" },
];

/** A batched backend fetch: one call, many ids, an `Error` slot for any id not in the table. */
export type FetchUsers = (ids: readonly number[]) => Promise<(User | Error)[]>;

export function makeUserBackend(users: readonly User[] = USERS): FetchUsers {
  return (ids) =>
    Promise.resolve(
      ids.map(
        (id) => users.find((user) => user.id === id) ?? new Error(`user ${id} not found`),
      ),
    );
}

/** Build a `userLoader` over the batched backend. */
export function createUserLoader(
  _fetchUsers: FetchUsers,
  _options?: DataLoaderOptions<number>,
): DataLoader<number, User> {
  throw new Error("TODO: build a DataLoader<number, User> over the backend fetch");
}

/** The loader path: all ids coalesce into a single backend call. */
export function resolveUsersWithLoader(
  _loader: DataLoader<number, User>,
  _ids: readonly number[],
): Promise<(User | Error)[]> {
  throw new Error("TODO: fan the ids through the loader's loadMany");
}

/** The naive baseline: one backend call per id, in order. */
export async function resolveUsersNaive(
  fetchUsers: FetchUsers,
  ids: readonly number[],
): Promise<(User | Error)[]> {
  const out: (User | Error)[] = [];
  for (const id of ids) {
    const [result] = await fetchUsers([id]);
    out.push(result ?? new Error(`user ${id} not found`));
  }
  return out;
}
