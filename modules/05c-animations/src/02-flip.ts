/**
 * FLIP from scratch — no animation library. FLIP = First, Last, Invert, Play.
 *
 *   First  — the element's rect BEFORE the DOM change.
 *   Last   — the element's rect AFTER the DOM change (it has jumped to its new spot).
 *   Invert — a `translate` + `scale` that visually maps Last back onto First, so it LOOKS like it
 *            never moved. translate = first - last; scale = first-size / last-size.
 *   Play   — transition that inverted transform back to identity; the browser animates the gap.
 *
 * All pure arithmetic over two DOMRect-like rects — testable with exact numbers, no layout engine.
 */

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Invert {
  dx: number;
  dy: number;
  sx: number;
  sy: number;
}

export interface FlipPlay {
  /** The inverted transform — apply it and the element appears at its OLD (first) position. */
  from: string;
  /** The identity transform — transition to this and the element slides to its natural spot. */
  to: string;
  /** True when first and last are equal: no motion needed, skip the animation. */
  isNoop: boolean;
}

/**
 * YOUR TURN — compute the inverted delta mapping `last` back onto `first`:
 *   dx = first.x - last.x,  dy = first.y - last.y
 *   sx = first.width / last.width,  sy = first.height / last.height  (use 1 when the last size is 0)
 */
export function invert(_first: Rect, _last: Rect): Invert {
  throw new Error("TODO: return { dx, dy, sx, sy } mapping last → first");
}

/** YOUR TURN — serialize to `translate(<dx>px, <dy>px) scale(<sx>, <sy>)`. */
export function transformOf(_inv: Invert): string {
  throw new Error("TODO: build the CSS transform string from the invert delta");
}

/**
 * YOUR TURN — produce the play: `from` = the inverted transform (element pinned to its old spot),
 * `to` = "translate(0px, 0px) scale(1, 1)" (identity). Set `isNoop` when the invert is a no-op
 * (dx/dy = 0 and sx/sy = 1), i.e. first and last are equal.
 */
export function flip(_first: Rect, _last: Rect): FlipPlay {
  throw new Error("TODO: return { from, to, isNoop } from the first/last rects");
}
