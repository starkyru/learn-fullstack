/** Tiny className joiner (no clsx dep at Phase 0). */
export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}
