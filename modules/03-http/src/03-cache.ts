export interface CacheResult {
  status: number;
  headers: Record<string, string>;
}

/**
 * YOUR TURN — implement conditional GET.
 * If `reqHeaders["if-none-match"]` equals `etag`: return { status: 304, headers: { ETag } }.
 * Otherwise: return { status: 200, headers: { ETag, "Cache-Control": "no-cache" } }.
 * (Header lookup is case-sensitive here; assume lowercase request-header keys.)
 */
export function conditionalResponse(
  _reqHeaders: Record<string, string>,
  _etag: string,
): CacheResult {
  throw new Error("TODO: return 304 on ETag match, else 200 + ETag");
}
