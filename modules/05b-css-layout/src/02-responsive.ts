/**
 * Container queries let a component reflow by the width of its CONTAINER, not the viewport. The
 * browser evaluates `@container (min-width: …)`; the unit-testable core is the DECISION: given a
 * container width, which layout applies? And `clamp()` fluid type: given a min/max size and the
 * viewport range to interpolate across, what exact `clamp(min, preferred, max)` string do we emit?
 *
 * YOUR TURN — implement both pure functions (delete the throws):
 *
 *   pickLayout(containerWidth):
 *     - containerWidth < 480            → "stack"
 *     - 480 <= containerWidth < 768     → "2col"
 *     - containerWidth >= 768           → "3col"
 *     (thresholds are the exported STACK_MAX / TWO_COL_MAX constants — inclusive lower bound.)
 *
 *   fluidType({ minPx, maxPx, minVw, maxVw }):
 *     Build the standard fluid-type clamp. With
 *       slope     = (maxPx - minPx) / (maxVw - minVw)
 *       slopeVw   = round(slope * 100)        // the vw coefficient
 *       intercept = round(minPx - slope * minVw)
 *     return `clamp(${minPx}px, ${slopeVw}vw + ${intercept}px, ${maxPx}px)`.
 *     `round` clamps to 4 decimals: Math.round(n * 10000) / 10000.
 *     Example: { minPx: 16, maxPx: 32, minVw: 400, maxVw: 1200 } → "clamp(16px, 2vw + 8px, 32px)".
 */

export const STACK_MAX = 480;
export const TWO_COL_MAX = 768;

export type BoardLayout = "stack" | "2col" | "3col";

export function pickLayout(_containerWidth: number): BoardLayout {
  throw new Error(
    "TODO: return 'stack' | '2col' | '3col' by comparing against STACK_MAX / TWO_COL_MAX",
  );
}

export interface FluidTypeOptions {
  minPx: number;
  maxPx: number;
  minVw: number;
  maxVw: number;
}

export function fluidType(_options: FluidTypeOptions): string {
  throw new Error(
    "TODO: build `clamp(${minPx}px, ${slopeVw}vw + ${intercept}px, ${maxPx}px)`",
  );
}
