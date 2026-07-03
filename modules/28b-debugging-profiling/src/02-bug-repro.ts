/**
 * Debugging a Node service — pin a subtle bug across an HTTP → service → repo (DB) call chain.
 *
 * The layered call: `listHandler` parses the query string, `paginate` (the service) computes the
 * page window, and `PageRepo` (the "DB") fetches a slice. Pages here are 1-indexed, so page 1 must
 * start at offset 0. Attaching `node --inspect` and stepping HTTP → service → repo (see the README)
 * lands you on the offending line — here you fix it and a unit test pins it.
 */

export interface PageRepo<T> {
  fetch(offset: number, limit: number): Promise<T[]>;
  count(): Promise<number>;
}

export interface PageResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
}

/** An in-memory repo over a plain array — the injected "DB" the tests drive. */
export function arrayRepo<T>(rows: readonly T[]): PageRepo<T> {
  return {
    fetch: (offset, limit) => Promise.resolve(rows.slice(offset, offset + limit)),
    count: () => Promise.resolve(rows.length),
  };
}

/**
 * YOUR TURN — implement the service. Pages are 1-INDEXED: page 1 starts at offset 0. Read `total`
 * from the repo, compute the offset, fetch the `pageSize` slice, and return the full `PageResult`
 * (compute `totalPages` with `Math.ceil` and `hasNext` as `page < totalPages`). Keep the signature.
 */
export async function paginate<T>(
  _repo: PageRepo<T>,
  _page: number,
  _pageSize: number,
): Promise<PageResult<T>> {
  throw new Error("TODO: compute the 1-indexed page window and return the PageResult");
}

export interface ListQuery {
  page?: string;
  pageSize?: string;
}

/** HTTP layer: parse query strings (with defaults) and delegate to the service. */
export async function listHandler<T>(
  query: ListQuery,
  repo: PageRepo<T>,
): Promise<PageResult<T>> {
  const page = Number(query.page ?? "1");
  const pageSize = Number(query.pageSize ?? "10");
  return paginate(repo, page, pageSize);
}
