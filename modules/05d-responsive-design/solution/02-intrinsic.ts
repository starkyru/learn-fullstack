/**
 * Intrinsic (content-out) responsive layout — reflow with ZERO media queries. `auto-fit` + `minmax`
 * lets a grid fit as many columns of at least `minPx` as the container allows and stretch them to
 * fill the row; when a column can't hold `minPx` the grid drops one on its own. No breakpoints, no
 * JS. `columnsAt` is that same behavior in numbers — how many columns a container width yields — so
 * the layout decision is unit-testable without a browser.
 */

export function autoFitGrid(minPx: number, gapPx: number): string {
  return `display: grid; gap: ${gapPx}px; grid-template-columns: repeat(auto-fit, minmax(${minPx}px, 1fr));`;
}

/** How many columns `auto-fit` yields for a container `width` (min column `minPx`, `gapPx` gap). */
export function columnsAt(width: number, minPx: number, gapPx: number): number {
  if (width < minPx) return 1;
  return Math.max(1, Math.floor((width + gapPx) / (minPx + gapPx)));
}
