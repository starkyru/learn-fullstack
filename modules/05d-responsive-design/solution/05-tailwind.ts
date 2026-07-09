/**
 * The same responsive grid expressed in Tailwind's mobile-first utilities. Tailwind bakes the
 * breakpoint scale into class PREFIXES (`sm:`/`md:`/`lg:`/`xl:`), all `min-width`, so an unprefixed
 * class is the mobile base and each prefixed one layers up — the same principle as `minWidthQuery`,
 * expressed as classes. `responsiveGridClasses` maps a per-breakpoint column count to that string.
 */

export interface ColsByBreakpoint {
  base: number;
  sm?: number;
  md?: number;
  lg?: number;
  xl?: number;
}

const ORDER = ["sm", "md", "lg", "xl"] as const;

export function responsiveGridClasses(cols: ColsByBreakpoint): string {
  const classes = ["grid", `grid-cols-${cols.base}`];
  for (const bp of ORDER) {
    const n = cols[bp];
    if (n !== undefined) classes.push(`${bp}:grid-cols-${n}`);
  }
  return classes.join(" ");
}
