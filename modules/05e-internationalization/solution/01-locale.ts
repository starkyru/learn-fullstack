export function resolveLocale(
  requested: string,
  supported: readonly string[],
  fallback: string,
): string {
  const normalized = requested.replace("_", "-").toLowerCase();
  const exact = supported.find((locale) => locale.toLowerCase() === normalized);
  if (exact) return exact;
  const language = normalized.split("-")[0];
  return (
    supported.find((locale) => locale.toLowerCase().split("-")[0] === language) ??
    fallback
  );
}
