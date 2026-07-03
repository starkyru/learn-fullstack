/**
 * The logic behind `next/image` and `next/font`. `next/image` generates a responsive
 * `srcset` (one candidate per width) + a `sizes` hint so the browser downloads the
 * smallest sufficient image, and marks the LCP hero `priority` (eager + high fetch
 * priority) instead of lazy. `next/font` self-hosts a font with `display: "swap"` and a
 * CSS variable so text paints immediately with a fallback (no layout shift, better LCP).
 * These builders reproduce that output as plain strings/objects you can assert exactly.
 *
 * EXTEND — this file already works; the src mirrors the solution. Try adding an AVIF/WebP
 * `type` per candidate, or a quality param, and extend the tests to lock in your change.
 */

export interface SizeEntry {
  /** Below this viewport width the entry does not apply; omit for the final default. */
  minWidth?: number;
  /** The slot width to use (e.g. "100vw", "640px"). */
  size: string;
}

export interface OptimizeImageInput {
  src: string;
  alt: string;
  widths: number[];
  sizes: SizeEntry[];
  width: number;
  height: number;
  /** The LCP hero: render eagerly with high fetch priority instead of lazy. */
  priority?: boolean;
}

export interface OptimizedImage {
  src: string;
  alt: string;
  srcSet: string;
  sizes: string;
  width: number;
  height: number;
  loading: "eager" | "lazy";
  fetchPriority: "high" | "auto";
  decoding: "async";
}

export interface FontConfig {
  family: string;
  subsets: string[];
  weights: number[];
  display: "swap";
  variable: string;
  preload: boolean;
}

/** One `"<src>?w=<w> <w>w"` candidate per width, comma-joined — an `<img srcset>` value. */
export function buildSrcSet(src: string, widths: number[]): string {
  return widths.map((w) => `${src}?w=${w} ${w}w`).join(", ");
}

/** A media-query `sizes` string; the entry without `minWidth` is the trailing default. */
export function buildSizes(entries: SizeEntry[]): string {
  return entries
    .map((e) =>
      e.minWidth === undefined ? e.size : `(min-width: ${e.minWidth}px) ${e.size}`,
    )
    .join(", ");
}

/**
 * Assemble the full optimized `<img>` prop set. The default `src` targets the largest
 * candidate width; `priority` picks eager/high (for the LCP element) vs lazy/auto.
 */
export function optimizeImage(input: OptimizeImageInput): OptimizedImage {
  const largest = Math.max(...input.widths);
  return {
    src: `${input.src}?w=${largest}`,
    alt: input.alt,
    srcSet: buildSrcSet(input.src, input.widths),
    sizes: buildSizes(input.sizes),
    width: input.width,
    height: input.height,
    loading: input.priority ? "eager" : "lazy",
    fetchPriority: input.priority ? "high" : "auto",
    decoding: "async",
  };
}

/** `next/font`-style config: self-hosted, `display: swap`, exposed as a CSS variable. */
export const displayFont: FontConfig = {
  family: "Inter",
  subsets: ["latin"],
  weights: [400, 600, 700],
  display: "swap",
  variable: "--font-display",
  preload: true,
};
