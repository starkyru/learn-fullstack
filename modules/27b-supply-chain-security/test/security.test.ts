import { describe, expect, it } from "vitest";
import { isPinnedAction } from "../solution/01-actions.js";
import { missingReleaseEvidence } from "../solution/02-release-gate.js";

describe("supply-chain release policy", () => {
  it("distinguishes immutable action references from tags", () => {
    expect(isPinnedAction("actions/checkout@" + "a".repeat(40))).toBe(true);
    expect(isPinnedAction("actions/checkout@v4")).toBe(false);
  });
  it("reports all missing release evidence", () => {
    expect(
      missingReleaseEvidence({
        audit: true,
        sbom: false,
        secretScan: false,
        e2e: true,
        migrationPlan: false,
      }),
    ).toEqual(["SBOM", "secret scan", "migration and rollback plan"]);
  });
});
