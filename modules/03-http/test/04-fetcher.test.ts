import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { HttpResponse, http } from "msw";
import { setupServer } from "msw/node";
import { createFetcher } from "../solution/04-fetcher.js";

let hits = 0;
let failuresLeft = 0;
const server = setupServer(
  http.get("http://api.test/data", () => {
    hits++;
    if (failuresLeft > 0) {
      failuresLeft--;
      return new HttpResponse(null, { status: 500 });
    }
    return HttpResponse.json({ ok: true });
  }),
);
beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => {
  server.resetHandlers();
  hits = 0;
  failuresLeft = 0;
});
afterAll(() => server.close());

describe("createFetcher", () => {
  it("retries a failing request until it succeeds", async () => {
    failuresLeft = 2;
    const get = createFetcher({ retries: 3, timeoutMs: 1000 });
    const res = await get("http://api.test/data");
    expect(res.status).toBe(200);
    expect(hits).toBe(3); // 2 failures + 1 success
  });

  it("de-dupes concurrent calls to the same URL into one request", async () => {
    const get = createFetcher({ retries: 0, timeoutMs: 1000 });
    const [a, b] = await Promise.all([
      get("http://api.test/data"),
      get("http://api.test/data"),
    ]);
    expect(a.status).toBe(200);
    expect(b.status).toBe(200);
    expect(hits).toBe(1);
  });
});
