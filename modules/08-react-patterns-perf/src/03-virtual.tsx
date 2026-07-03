/**
 * YOUR TURN (🔴 from scratch) — compute the window of rows to render.
 * Given the scroll offset, viewport height, fixed row height, and total count, return the
 * inclusive `start` and exclusive `end` indices of visible rows, plus an `overscan` of 1 row
 * on each side (clamped to [0, count]). No react-window.
 *   start = max(0, floor(scrollTop / rowHeight) - overscan)
 *   end   = min(count, ceil((scrollTop + viewportH) / rowHeight) + overscan)
 */
export function visibleRange(
  _scrollTop: number,
  _viewportH: number,
  _rowHeight: number,
  _count: number,
  _overscan = 1,
): { start: number; end: number } {
  throw new Error("TODO: compute the windowed [start, end) with overscan");
}
