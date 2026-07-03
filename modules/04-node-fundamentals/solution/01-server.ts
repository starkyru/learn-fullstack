export interface RouteResult {
  status: number;
  body: unknown;
}

export function route(method: string, path: string): RouteResult {
  if (method === "GET" && path === "/health") return { status: 200, body: { ok: true } };
  return { status: 404, body: { error: "not found" } };
}

export function routeV2(method: string, path: string): RouteResult {
  if (method === "GET" && path === "/version")
    return { status: 200, body: { version: "1.0.0" } };
  return route(method, path);
}
