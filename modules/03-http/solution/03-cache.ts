export interface CacheResult {
  status: number;
  headers: Record<string, string>;
}

export function conditionalResponse(
  reqHeaders: Record<string, string>,
  etag: string,
): CacheResult {
  if (reqHeaders["if-none-match"] === etag) {
    return { status: 304, headers: { ETag: etag } };
  }
  return { status: 200, headers: { ETag: etag, "Cache-Control": "no-cache" } };
}
