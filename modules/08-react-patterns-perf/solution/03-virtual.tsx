export function visibleRange(
  scrollTop: number,
  viewportH: number,
  rowHeight: number,
  count: number,
  overscan = 1,
): { start: number; end: number } {
  const start = Math.max(0, Math.floor(scrollTop / rowHeight) - overscan);
  const end = Math.min(count, Math.ceil((scrollTop + viewportH) / rowHeight) + overscan);
  return { start, end };
}
