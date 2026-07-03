import request from "supertest";
import { describe, expect, it } from "vitest";
import { createMiddlewareApp, type LogEntry } from "../solution/02-middleware.js";

const API_KEY = "secret-key";

function app(sink: LogEntry[] = []) {
  return createMiddlewareApp({ sink, apiKey: API_KEY });
}

describe("middleware", () => {
  it("requireApiKey → 401 without the x-api-key header", async () => {
    const res = await request(app()).get("/secret");
    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: "Unauthorized" });
  });

  it("requireApiKey → 200 with the matching header", async () => {
    const res = await request(app()).get("/secret").set("x-api-key", API_KEY);
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true });
  });

  it("errorHandler maps a thrown AppError to its status + { error }", async () => {
    const res = await request(app()).get("/boom");
    expect(res.status).toBe(418);
    expect(res.body).toEqual({ error: "I am a teapot" });
  });

  it("errorHandler maps an unknown throw to 500", async () => {
    const res = await request(app()).get("/crash");
    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: "Internal Server Error" });
  });

  it("requestLogger records { method, url, status } into the injected sink, in order", async () => {
    const sink: LogEntry[] = [];
    const server = app(sink);

    await request(server).get("/secret"); // 401
    await request(server).get("/secret").set("x-api-key", API_KEY); // 200

    expect(sink).toEqual([
      { method: "GET", url: "/secret", status: 401 },
      { method: "GET", url: "/secret", status: 200 },
    ]);
  });

  it("requestLogger records the final 500 status for a crashing route", async () => {
    const sink: LogEntry[] = [];
    await request(app(sink)).get("/crash");
    expect(sink).toEqual([{ method: "GET", url: "/crash", status: 500 }]);
  });
});
