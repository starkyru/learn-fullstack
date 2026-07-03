/**
 * Debugging a Node service — pin a subtle bug across an HTTP → service → repo (DB) call chain.
 *
 * The layered call: `listHandler` parses the query string, `paginate` (the service) computes the
 * page window, and `PageRepo` (the "DB") fetches a slice. The bug lives in the service: an
 * off-by-one in the offset. Pages here are 1-indexed, so page 1 must start at offset 0. The buggy
 * version used `offset = page * pageSize`, which SKIPS the entire first page — every response is
 * shifted by one page. Attaching `node --inspect` and stepping HTTP → service → repo (see the
 * README) lands you on the offset line; here the fix is unit-tested end-to-end.
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
 * Service layer. FIX: page is 1-indexed, so the offset is `(page - 1) * pageSize`, NOT
 * `page * pageSize`. Everything downstream (which items, hasNext, totalPages) hinges on this line.
 */
export async function paginate<T>(
  repo: PageRepo<T>,
  page: number,
  pageSize: number,
): Promise<PageResult<T>> {
  const total = await repo.count();
  const offset = (page - 1) * pageSize;
  const items = await repo.fetch(offset, pageSize);
  const totalPages = Math.ceil(total / pageSize);
  return { items, page, pageSize, total, totalPages, hasNext: page < totalPages };
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
