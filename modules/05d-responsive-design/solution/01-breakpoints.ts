/**
 * Mobile-first breakpoints. Base styles target the smallest screen; each breakpoint LAYERS UP with
 * `min-width` (never down). This is the core responsive principle: write the phone layout first,
 * then progressively enhance for wider viewports. `minWidthQuery` is the mobile-first query;
 * `maxWidthQuery` is the desktop-first counterpart (styles that cap out below a width) — you rarely
 * want it, and seeing both makes the direction of the cascade explicit.
 */

export const BREAKPOINTS = { sm: 640, md: 768, lg: 1024, xl: 1280 } as const;

export type Breakpoint = keyof typeof BREAKPOINTS;

/** Mobile-first: styles enhance upward from this width. */
export function minWidthQuery(bp: Breakpoint): string {
  return `@media (min-width: ${BREAKPOINTS[bp]}px)`;
}

/** Desktop-first: applies strictly BELOW the breakpoint (bp − 1px avoids the 1px overlap seam). */
export function maxWidthQuery(bp: Breakpoint): string {
  return `@media (max-width: ${BREAKPOINTS[bp] - 1}px)`;
}
