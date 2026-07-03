export function corsHeaders(
  origin: string,
  allowlist: readonly string[],
): Record<string, string> {
  if (!allowlist.includes(origin)) return { Vary: "Origin" };
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Credentials": "true",
    Vary: "Origin",
  };
}
