import { describe, expect, it } from "vitest";
import {
  providerResponse,
  testingTrophyNote,
  verifyProvider,
} from "../solution/05-contract.js";

describe("Task 5 — the testing-trophy note", () => {
  it("names all four tiers, from static base to E2E tip, in order", () => {
    const iStatic = testingTrophyNote.indexOf("Static");
    const iUnit = testingTrophyNote.indexOf("Unit");
    const iIntegration = testingTrophyNote.indexOf("Integration");
    const iE2E = testingTrophyNote.indexOf("End-to-end");

    expect(iStatic).toBeGreaterThanOrEqual(0);
    expect(iStatic).toBeLessThan(iUnit);
    expect(iUnit).toBeLessThan(iIntegration);
    expect(iIntegration).toBeLessThan(iE2E);
    expect(testingTrophyNote).toContain("Mostly integration");
    // Pin the distinctive Integration-tier description, not just the heading order.
    expect(testingTrophyNote).toContain(
      "ratio of confidence to cost, because it exercises the seams where bugs actually live.",
    );
  });
});

describe("Task 5 — contract test (consumer expectation vs provider)", () => {
  it("passes when the provider response satisfies the contract", () => {
    const result = verifyProvider(providerResponse("Ship it"));
    expect(result).toEqual({ ok: true, value: { id: 1, title: "Ship it" } });
  });

  it("fails, listing every offending path, when the provider drifts", () => {
    const result = verifyProvider({ id: 0, title: "" });

    expect(result.ok).toBe(false);
    if (result.ok) throw new Error("expected the contract to reject a drifted response");
    expect(result.issues).toHaveLength(2);
    expect(result.issues.some((m) => m.startsWith("id:"))).toBe(true);
    expect(result.issues.some((m) => m.startsWith("title:"))).toBe(true);
  });

  it("fails with an `id` violation when a required field is missing", () => {
    const result = verifyProvider({ title: "no id here" });

    expect(result.ok).toBe(false);
    if (result.ok) throw new Error("expected the contract to reject a missing field");
    expect(result.issues.some((m) => m.startsWith("id:"))).toBe(true);
  });

  it("rejects a wrong-typed field (title as a number)", () => {
    const result = verifyProvider({ id: 3, title: 123 });

    expect(result.ok).toBe(false);
    if (result.ok) throw new Error("expected the contract to reject a wrong type");
    expect(result.issues.some((m) => m.startsWith("title:"))).toBe(true);
  });
});
