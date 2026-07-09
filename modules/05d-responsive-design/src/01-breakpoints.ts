/**
 * Mobile-first breakpoints. Base styles target the smallest screen; each breakpoint LAYERS UP with
 * `min-width` (never down). Write the phone layout first, then progressively enhance for wider
 * viewports.
 *
 * `minWidthQuery` is the solved worked example (mobile-first). YOUR TURN: implement `maxWidthQuery`,
 * the desktop-first counterpart — a `max-width` query that applies strictly BELOW the breakpoint.
 * Use `BREAKPOINTS[bp] - 1` so it doesn't overlap the mobile-first query by 1px.
 */

export const BREAKPOINTS = { sm: 640, md: 768, lg: 1024, xl: 1280 } as const;

export type Breakpoint = keyof typeof BREAKPOINTS;

/** Mobile-first: styles enhance upward from this width. */
export function minWidthQuery(bp: Breakpoint): string {
  return `@media (min-width: ${BREAKPOINTS[bp]}px)`;
}

export function maxWidthQuery(_bp: Breakpoint): string {
  throw new Error(
    "TODO: `@media (max-width: <bp − 1>px)` — the desktop-first counterpart",
  );
}
