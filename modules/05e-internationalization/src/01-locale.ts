/** Choose an exact locale, then its language parent, and finally the explicit fallback. */
export function resolveLocale(
  _requested: string,
  _supported: readonly string[],
  _fallback: string,
): string {
  throw new Error(
    "TODO: normalize the requested locale and select exact → language → fallback",
  );
}
