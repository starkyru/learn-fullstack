export interface RouteResult {
  status: number;
  body: unknown;
}

/**
 * WORKED EXAMPLE — the routing core you'd drop into `http.createServer((req, res) => …)`.
 * GET /health → 200 { ok: true }. Unknown → 404 { error: "not found" }.
 */
export function route(method: string, path: string): RouteResult {
  if (method === "GET" && path === "/health") return { status: 200, body: { ok: true } };
  return { status: 404, body: { error: "not found" } };
}

/**
 * YOUR TURN (analog) — extend routing with `GET /version` → 200 { version: "1.0.0" }.
 * Return the same shape as `route`; fall through to 404 for anything else.
 */
export function routeV2(_method: string, _path: string): RouteResult {
  throw new Error("TODO: handle GET /version, else 404 (reuse the route pattern)");
}
