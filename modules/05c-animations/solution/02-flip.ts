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

/** Compute the inverted delta that maps `last` back onto `first`. Zero-size rects scale by 1. */
export function invert(first: Rect, last: Rect): Invert {
  return {
    dx: first.x - last.x,
    dy: first.y - last.y,
    sx: last.width === 0 ? 1 : first.width / last.width,
    sy: last.height === 0 ? 1 : first.height / last.height,
  };
}

/** Serialize an inverted delta to a CSS `transform` string. */
export function transformOf(inv: Invert): string {
  return `translate(${inv.dx}px, ${inv.dy}px) scale(${inv.sx}, ${inv.sy})`;
}

/**
 * Given First and Last rects, produce the play: `from` is the inverted transform (element pinned to
 * its old position) and `to` is identity (its natural new position). When the rects are identical
 * the invert is a no-op, so `isNoop` is true and both transforms are identity.
 */
export function flip(first: Rect, last: Rect): FlipPlay {
  const inv = invert(first, last);
  const isNoop = inv.dx === 0 && inv.dy === 0 && inv.sx === 1 && inv.sy === 1;
  return {
    from: transformOf(inv),
    to: "translate(0px, 0px) scale(1, 1)",
    isNoop,
  };
}
