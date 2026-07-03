export async function pMap<T, R>(
  items: readonly T[],
  mapper: (item: T, index: number) => Promise<R>,
  opts: { concurrency: number },
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let nextIndex = 0;

  async function worker(): Promise<void> {
    while (nextIndex < items.length) {
      const current = nextIndex++;
      results[current] = await mapper(items[current]!, current);
    }
  }

  const size = Math.max(1, Math.min(opts.concurrency, items.length));
  await Promise.all(Array.from({ length: size }, () => worker()));
  return results;
}
