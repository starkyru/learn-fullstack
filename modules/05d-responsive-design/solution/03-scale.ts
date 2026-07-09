/**
 * Fluid type & space via a modular scale in rem units. A modular scale multiplies a base by a ratio
 * per step (step 0 = base, +1 = ×ratio, −1 = ÷ratio) so headings and spacing grow in tune instead
 * of by arbitrary pixels. Sizing in `rem` — not px — means the whole scale honors the user's root
 * font-size and browser zoom, the accessibility principle behind responsive type.
 */

const round4 = (n: number): number => Math.round(n * 10000) / 10000;

/** The value at `step` on a modular scale: `base * ratio ** step`. */
export function modularScale(baseRem: number, ratio: number, step: number): number {
  return round4(baseRem * ratio ** step);
}

/** Convert a px value to rem against the root font-size (default 16px), for zoom-safe sizing. */
export function pxToRem(px: number, rootPx = 16): string {
  return `${round4(px / rootPx)}rem`;
}
