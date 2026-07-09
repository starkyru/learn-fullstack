/**
 * Fluid type & space via a modular scale in rem units. A modular scale multiplies a base by a ratio
 * per step so headings/spacing grow in tune. `rem` (not px) honors the user's root font-size + zoom.
 *
 * YOUR TURN:
 *   modularScale(baseRem, ratio, step):
 *     1. Return `base * ratio ** step`, rounded to 4 decimals (step 0 = base, −1 = ÷ratio).
 *   pxToRem(px, rootPx = 16):
 *     2. Return `"<px / rootPx>rem"`, rounded to 4 decimals.
 */

export function modularScale(_baseRem: number, _ratio: number, _step: number): number {
  throw new Error("TODO: base * ratio ** step, rounded");
}

export function pxToRem(_px: number, _rootPx = 16): string {
  throw new Error("TODO: `${px / rootPx}rem`");
}
