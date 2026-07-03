import { describe, expect, it } from "vitest";
import {
  GET,
  partitionPPR,
  renderShell,
  renderStreamed,
  resolveHoles,
  runtime,
  type Segment,
} from "../solution/03-ppr-edge.js";

/** A product page: static header/footer shell around a dynamic cart hole. */
function route(): Segment[] {
  return [
    { kind: "static", id: "header", html: "<header>Store</header>" },
    {
      kind: "dynamic",
      id: "cart",
      fallback: "<span>Loading cart…</span>",
      resolve: () => Promise.resolve("<span>3 items</span>"),
    },
    { kind: "static", id: "footer", html: "<footer>© 2026</footer>" },
  ];
}

describe("partitionPPR", () => {
  it("splits the route into a static shell and deferred holes", () => {
    const { staticParts, dynamicHoles } = partitionPPR(route());
    expect(staticParts.map((p) => p.id)).toEqual(["header", "footer"]);
    expect(dynamicHoles.map((h) => h.id)).toEqual(["cart"]);
    expect(dynamicHoles[0]?.fallback).toBe("<span>Loading cart…</span>");
  });
});

describe("renderShell", () => {
  it("is instant: static HTML with the hole showing its fallback, not resolved data", () => {
    const shell = renderShell(route());
    expect(shell).toBe(
      '<header>Store</header><div data-hole="cart"><span>Loading cart…</span></div><footer>© 2026</footer>',
    );
    expect(shell).not.toContain("3 items");
  });
});

describe("streaming the hole", () => {
  it("resolveHoles awaits each hole to its final HTML", async () => {
    expect(await resolveHoles(route())).toEqual({ cart: "<span>3 items</span>" });
  });

  it("renderStreamed fills the hole with resolved data inside the static shell", async () => {
    const html = await renderStreamed(route());
    expect(html).toBe(
      '<header>Store</header><div data-hole="cart"><span>3 items</span></div><footer>© 2026</footer>',
    );
  });
});

describe("multiple holes and missing resolutions", () => {
  /** Two dynamic holes so a fill that keys by array index instead of hole id is caught. */
  function twoHoleRoute(): Segment[] {
    return [
      { kind: "static", id: "header", html: "<header>Store</header>" },
      {
        kind: "dynamic",
        id: "cart",
        fallback: "<span>Loading cart…</span>",
        resolve: () => Promise.resolve("<span>3 items</span>"),
      },
      {
        kind: "dynamic",
        id: "reco",
        fallback: "<span>Loading recs…</span>",
        resolve: () => Promise.resolve("<ul>picks</ul>"),
      },
      { kind: "static", id: "footer", html: "<footer>© 2026</footer>" },
    ];
  }

  it("renderStreamed fills EACH hole with ITS OWN resolved html, matched by id not index", async () => {
    const html = await renderStreamed(twoHoleRoute());
    expect(html).toBe(
      "<header>Store</header>" +
        '<div data-hole="cart"><span>3 items</span></div>' +
        '<div data-hole="reco"><ul>picks</ul></div>' +
        "<footer>© 2026</footer>",
    );
  });

  it("renderStreamed falls back to the hole's fallback when its resolved value is missing", async () => {
    const segments: Segment[] = [
      { kind: "static", id: "header", html: "<header>Store</header>" },
      {
        kind: "dynamic",
        id: "cart",
        fallback: "<span>Loading cart…</span>",
        // Resolves to no HTML — the streamed frame must keep showing the fallback.
        resolve: () => Promise.resolve(undefined as unknown as string),
      },
      { kind: "static", id: "footer", html: "<footer>© 2026</footer>" },
    ];
    const html = await renderStreamed(segments);
    expect(html).toBe(
      '<header>Store</header><div data-hole="cart"><span>Loading cart…</span></div><footer>© 2026</footer>',
    );
  });
});

describe("edge handler", () => {
  it("is marked for the edge runtime", () => {
    expect(runtime).toBe("edge");
  });

  it("GET returns a 200 JSON greeting for ?name=", async () => {
    const res = await GET(new Request("https://x.test/api/hello?name=ada"));
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe("application/json");
    expect(res.headers.get("x-edge-runtime")).toBe("1");
    expect(await res.json()).toEqual({ hello: "ada", runtime: "edge" });
  });

  it("GET defaults name to 'world' when the query is absent", async () => {
    const res = await GET(new Request("https://x.test/api/hello"));
    expect(await res.json()).toEqual({ hello: "world", runtime: "edge" });
  });
});
