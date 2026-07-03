import { describe, expect, it } from "vitest";
import { isAllowedOrigin, issueCsrfToken, verifyCsrf } from "../solution/02-csrf.js";

const allowed = ["https://app.example.com"];

describe("issueCsrfToken", () => {
  it("returns exactly what the injected generator produces", () => {
    expect(issueCsrfToken(() => "csrf-abc")).toBe("csrf-abc");
  });
});

describe("isAllowedOrigin", () => {
  it("allows a matching Origin and rejects a mismatch", () => {
    expect(isAllowedOrigin("https://app.example.com", undefined, allowed)).toBe(true);
    expect(isAllowedOrigin("https://evil.example.com", undefined, allowed)).toBe(false);
  });

  it("falls back to the Referer's origin, and rejects when neither is present", () => {
    expect(isAllowedOrigin(undefined, "https://app.example.com/login", allowed)).toBe(
      true,
    );
    expect(isAllowedOrigin(undefined, "https://evil.example.com/x", allowed)).toBe(false);
    expect(isAllowedOrigin(undefined, undefined, allowed)).toBe(false);
  });
});

describe("verifyCsrf", () => {
  it("is true when the double-submit tokens match and the origin is allowlisted", () => {
    expect(
      verifyCsrf({
        cookieToken: "csrf-abc",
        submittedToken: "csrf-abc",
        origin: "https://app.example.com",
        allowedOrigins: allowed,
      }),
    ).toBe(true);
  });

  it("is false when the tokens mismatch, even with a good origin", () => {
    expect(
      verifyCsrf({
        cookieToken: "csrf-abc",
        submittedToken: "csrf-xyz",
        origin: "https://app.example.com",
        allowedOrigins: allowed,
      }),
    ).toBe(false);
  });

  it("is false on a disallowed origin, even when the tokens match", () => {
    expect(
      verifyCsrf({
        cookieToken: "csrf-abc",
        submittedToken: "csrf-abc",
        origin: "https://evil.example.com",
        allowedOrigins: allowed,
      }),
    ).toBe(false);
  });

  it("is false when a token is missing on either side", () => {
    expect(
      verifyCsrf({
        cookieToken: undefined,
        submittedToken: "csrf-abc",
        origin: "https://app.example.com",
        allowedOrigins: allowed,
      }),
    ).toBe(false);
    expect(
      verifyCsrf({
        cookieToken: "csrf-abc",
        submittedToken: undefined,
        origin: "https://app.example.com",
        allowedOrigins: allowed,
      }),
    ).toBe(false);
  });
});
