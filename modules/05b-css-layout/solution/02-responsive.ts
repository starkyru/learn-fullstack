/**
 * Container-query breakpoint resolver + `clamp()` fluid-type builder. Both are the pure DECISION
 * layer under CSS: which layout a container width selects, and the exact clamp string to emit.
 */

export const STACK_MAX = 480;
export const TWO_COL_MAX = 768;

export type BoardLayout = "stack" | "2col" | "3col";

export function pickLayout(containerWidth: number): BoardLayout {
  if (containerWidth < STACK_MAX) return "stack";
  if (containerWidth < TWO_COL_MAX) return "2col";
  return "3col";
}

export interface FluidTypeOptions {
  minPx: number;
  maxPx: number;
  minVw: number;
  maxVw: number;
}

const round = (n: number): number => Math.round(n * 10000) / 10000;

export function fluidType({ minPx, maxPx, minVw, maxVw }: FluidTypeOptions): string {
  const slope = (maxPx - minPx) / (maxVw - minVw);
  const slopeVw = round(slope * 100);
  const intercept = round(minPx - slope * minVw);
  return `clamp(${minPx}px, ${slopeVw}vw + ${intercept}px, ${maxPx}px)`;
}
