import { createDataLoader } from "./02-cache-dedupe.js";
import type { DataLoader, DataLoaderOptions } from "./02-cache-dedupe.js";

/**
 * Wire the from-scratch loader into a tiny "resolver", the way a GraphQL field resolver would use a
 * per-request DataLoader. We model a `users` field two ways and prove they agree:
 *
 *   - `resolveUsersWithLoader` fans N ids through ONE loader, so the backing `fetchUsers` is called
 *     once per tick no matter how many (or how repeated) the ids are — the N+1 fix.
 *   - `resolveUsersNaive` is the un-batched baseline: it hits `fetchUsers` once PER id.
 *
 * Both return the same per-index results; the point of task 3 is that swapping the naive path for the
 * loader path changes only the number of backend calls, not the answer.
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
  fetchUsers: FetchUsers,
  options?: DataLoaderOptions<number>,
): DataLoader<number, User> {
  return createDataLoader<number, User>(fetchUsers, options);
}

/** The loader path: all ids coalesce into a single backend call. */
export function resolveUsersWithLoader(
  loader: DataLoader<number, User>,
  ids: readonly number[],
): Promise<(User | Error)[]> {
  return loader.loadMany(ids);
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
