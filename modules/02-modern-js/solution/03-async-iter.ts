export interface Page<T> {
  items: T[];
  next?: string;
}

export async function* paginate<T>(
  fetchPage: (cursor?: string) => Promise<Page<T>>,
): AsyncGenerator<T> {
  let cursor: string | undefined = undefined;
  do {
    const page: Page<T> = await fetchPage(cursor);
    for (const item of page.items) yield item;
    cursor = page.next;
  } while (cursor !== undefined);
}
