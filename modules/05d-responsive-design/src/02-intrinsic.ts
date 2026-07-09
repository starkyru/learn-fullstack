/**
 * Intrinsic (content-out) responsive layout — reflow with ZERO media queries. `auto-fit` + `minmax`
 * fits as many columns of at least `minPx` as the container allows and stretches them to fill; below
 * `minPx` the grid drops a column on its own.
 *
 * YOUR TURN:
 *   autoFitGrid(minPx, gapPx):
 *     1. Return the CSS: `display: grid; gap: <gap>px; grid-template-columns: repeat(auto-fit,
 *        minmax(<min>px, 1fr));`
 *   columnsAt(width, minPx, gapPx):
 *     2. The same behavior in numbers. Below `minPx` → 1 column.
 *     3. Otherwise `floor((width + gap) / (minPx + gap))`, clamped to a minimum of 1.
 */

export function autoFitGrid(_minPx: number, _gapPx: number): string {
  throw new Error("TODO: repeat(auto-fit, minmax(<min>px, 1fr)) grid declaration");
}

export function columnsAt(_width: number, _minPx: number, _gapPx: number): number {
  throw new Error("TODO: how many auto-fit columns fit at this width");
}
