import { describe, expect, it } from "vitest";
import { conditionalResponse } from "../solution/03-cache.js";

describe("conditionalResponse", () => {
  it("returns 304 when If-None-Match equals the ETag", () => {
    const res = conditionalResponse({ "if-none-match": "v1" }, "v1");
    expect(res.status).toBe(304);
    expect(res.headers.ETag).toBe("v1");
  });

  it("returns 200 + ETag when the ETag does not match", () => {
    const res = conditionalResponse({ "if-none-match": "old" }, "v2");
    expect(res.status).toBe(200);
    expect(res.headers).toEqual({ ETag: "v2", "Cache-Control": "no-cache" });
  });
});
