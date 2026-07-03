import { describe, expect, it } from "vitest";
import { corsHeaders } from "../solution/02-cors.js";

const allow = ["https://app.test"];

describe("corsHeaders", () => {
  it("echoes an allowed origin with credentials", () => {
    expect(corsHeaders("https://app.test", allow)).toEqual({
      "Access-Control-Allow-Origin": "https://app.test",
      "Access-Control-Allow-Credentials": "true",
      Vary: "Origin",
    });
  });

  it("omits Allow-Origin for a disallowed origin", () => {
    const headers = corsHeaders("https://evil.test", allow);
    expect(headers["Access-Control-Allow-Origin"]).toBeUndefined();
  });
});
