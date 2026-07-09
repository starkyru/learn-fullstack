/**
 * Rebuild a responsive app shell in pure CSS — mobile-first, no Tailwind, no UI kit. The decision
 * this module tests: the nav is an off-canvas DRAWER on narrow screens and a persistent FIXED
 * sidebar once there's room (≥ lg). `sidebarMode` is that rule; the matching hand-written CSS lives
 * in `artifacts/responsive.css` (mobile-first base + one `min-width` layer + an intrinsic `auto-fit`
 * content grid + a `clamp()` fluid heading).
 */

import { BREAKPOINTS } from "./01-breakpoints.js";

export function sidebarMode(width: number): "drawer" | "fixed" {
  return width < BREAKPOINTS.lg ? "drawer" : "fixed";
}
