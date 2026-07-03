export interface Page<T> {
  items: T[];
  next?: string;
}

/**
 * YOUR TURN (🔴 from scratch) — an async generator that yields every item across all pages.
 * Call `fetchPage(cursor)` starting with `undefined`; yield each item; follow `page.next`
 * until it is undefined. No library. Signature returns `AsyncGenerator<T>`.
 */
export async function* paginate<T>(
  _fetchPage: (cursor?: string) => Promise<Page<T>>,
): AsyncGenerator<T> {
  throw new Error("TODO: loop pages, yield items, follow page.next");
}
