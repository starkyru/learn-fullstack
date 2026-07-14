import { describe, expect, it } from "vitest";
import { formatCommitSubject, parseCommitSubject } from "../solution/01-commit.js";
import { buildPullRequestChecklist } from "../solution/02-pr-checklist.js";

describe("Git collaboration helpers", () => {
  it("formats a scoped breaking commit", () => {
    expect(
      formatCommitSubject(parseCommitSubject("feat(auth)!: rotate refresh tokens")),
    ).toBe("feat(auth)!: rotate refresh tokens");
  });
  it("requires production checks for a schema deploy", () => {
    expect(buildPullRequestChecklist(["schema", "deployment"]).rollback).toEqual([
      "backward-compatible rollback",
      "traffic rollback",
    ]);
  });
});
