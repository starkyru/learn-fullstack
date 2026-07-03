export type WcagLevel = "AA" | "AAA";

/**
 * YOUR TURN (🔴 from scratch) — the WCAG contrast ratio between two hex colors.
 * Steps: parse each "#rrggbb" to r,g,b (0–255); convert each channel to linear sRGB
 *   c' = c/255; L_channel = c' <= 0.03928 ? c'/12.92 : ((c'+0.055)/1.055) ** 2.4
 * relative luminance L = 0.2126*R + 0.7152*G + 0.0722*B; then
 * ratio = (Llighter + 0.05) / (Ldarker + 0.05). No color library.
 */
export function contrastRatio(_fgHex: string, _bgHex: string): number {
  throw new Error("TODO: compute the WCAG contrast ratio from relative luminance");
}

/**
 * YOUR TURN — does `ratio` meet WCAG for the given level?
 * Thresholds: AA normal 4.5, AA large 3.0, AAA normal 7.0, AAA large 4.5.
 */
export function meetsWCAG(
  _ratio: number,
  _opts: { level: WcagLevel; largeText?: boolean },
): boolean {
  throw new Error("TODO: compare ratio against the WCAG threshold");
}
