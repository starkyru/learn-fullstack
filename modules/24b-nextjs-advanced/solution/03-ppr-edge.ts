/**
 * Partial Prerendering (PPR) + the edge runtime, modeled as pure functions.
 *
 * PPR ships a static *shell* instantly and streams the dynamic *holes* in afterwards. We model a
 * route as an ordered list of segments: `static` segments are prerendered HTML; `dynamic` segments
 * are holes with a `fallback` (shown in the shell) and a `resolve()` that produces the real HTML
 * once data is ready.
 *
 *   - `partitionPPR(segments)` splits the route into `{ staticParts, dynamicHoles }`.
 *   - `renderShell(segments)` is the instant prerender: static HTML with each hole showing its
 *     fallback — it NEVER awaits `resolve`.
 *   - `resolveHoles(segments)` awaits every hole → a `{ id: html }` map.
 *   - `renderStreamed(segments)` is the final frame: the shell with holes filled by resolved HTML.
 *
 * The edge handler is a Web-standard `Request → Response` — only Web APIs (`URL`, `Response`),
 * never Node built-ins — so it runs on the edge runtime.
 */

export type Segment =
  | { kind: "static"; id: string; html: string }
  | { kind: "dynamic"; id: string; fallback: string; resolve: () => Promise<string> };

export interface PPRRoute {
  staticParts: Array<{ id: string; html: string }>;
  dynamicHoles: Array<{ id: string; fallback: string; resolve: () => Promise<string> }>;
}

function holeSlot(id: string, content: string): string {
  return `<div data-hole="${id}">${content}</div>`;
}

/** Split a route into its static shell parts and its deferred dynamic holes. */
export function partitionPPR(segments: Segment[]): PPRRoute {
  const staticParts: PPRRoute["staticParts"] = [];
  const dynamicHoles: PPRRoute["dynamicHoles"] = [];
  for (const segment of segments) {
    if (segment.kind === "static") {
      staticParts.push({ id: segment.id, html: segment.html });
    } else {
      dynamicHoles.push({
        id: segment.id,
        fallback: segment.fallback,
        resolve: segment.resolve,
      });
    }
  }
  return { staticParts, dynamicHoles };
}

/** The instant prerender: static HTML with each hole showing its fallback. Never awaits. */
export function renderShell(segments: Segment[]): string {
  return segments
    .map((segment) =>
      segment.kind === "static" ? segment.html : holeSlot(segment.id, segment.fallback),
    )
    .join("");
}

/** Resolve every dynamic hole to its final HTML, keyed by hole id. */
export async function resolveHoles(segments: Segment[]): Promise<Record<string, string>> {
  const out: Record<string, string> = {};
  for (const segment of segments) {
    if (segment.kind === "dynamic") {
      out[segment.id] = await segment.resolve();
    }
  }
  return out;
}

/** The final streamed frame: the shell with each hole filled by its resolved HTML. */
export async function renderStreamed(segments: Segment[]): Promise<string> {
  const resolved = await resolveHoles(segments);
  return segments
    .map((segment) =>
      segment.kind === "static"
        ? segment.html
        : holeSlot(segment.id, resolved[segment.id] ?? segment.fallback),
    )
    .join("");
}

/** Marks this route handler for the edge runtime (Web APIs only, no Node built-ins). */
export const runtime = "edge";

/**
 * Edge route handler: `GET /?name=…` → JSON greeting. Uses only `URL` and `Response`, so it is
 * unit-testable by calling it with a real `Request` and asserting the `Response`.
 */
export async function GET(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const name = url.searchParams.get("name") ?? "world";
  const body = JSON.stringify({ hello: name, runtime: "edge" });
  return new Response(body, {
    status: 200,
    headers: { "content-type": "application/json", "x-edge-runtime": "1" },
  });
}
