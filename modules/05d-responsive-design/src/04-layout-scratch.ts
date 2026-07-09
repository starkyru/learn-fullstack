/**
 * 🔴 FROM SCRATCH — rebuild a responsive app shell in pure CSS: mobile-first, NO Tailwind, NO UI
 * kit. Write the CSS by hand in `artifacts/responsive.css` (mobile-first base + one `min-width`
 * layer + an intrinsic `auto-fit` content grid + a `clamp()` fluid heading), and implement the
 * layout decision this module tests:
 *
 *   sidebarMode(width): the nav is an off-canvas "drawer" on narrow screens and a persistent
 *   "fixed" sidebar once there's room. Flip to "fixed" at the `lg` breakpoint (1024), "drawer" below.
 *   Import `BREAKPOINTS` from `./01-breakpoints.js` rather than hardcoding 1024.
 */

export function sidebarMode(_width: number): "drawer" | "fixed" {
  throw new Error('TODO: "drawer" below lg, "fixed" at/above lg (use BREAKPOINTS.lg)');
}
