import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { HttpResponse, http } from "msw";
import { setupServer } from "msw/node";
import { httpPost } from "../solution/01-client.js";

const server = setupServer(
  http.post("http://api.test/echo", async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json({ received: body });
  }),
);
beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe("httpPost", () => {
  it("sends a JSON body and parses the JSON response", async () => {
    const res = await httpPost<{ received: { name: string } }>("http://api.test/echo", {
      name: "Ada",
    });
    expect(res.received).toEqual({ name: "Ada" });
  });
});
