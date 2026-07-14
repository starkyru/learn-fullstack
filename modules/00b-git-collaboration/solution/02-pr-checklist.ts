export type Change = "schema" | "behavior" | "deployment" | "docs";
export type PullRequestChecklist = {
  review: string[];
  verify: string[];
  rollback: string[];
};

export function buildPullRequestChecklist(changes: Change[]): PullRequestChecklist {
  const set = new Set(changes);
  return {
    review: [
      "intent and risk",
      ...(set.has("schema") ? ["migration compatibility"] : []),
    ],
    verify: [
      "targeted tests",
      ...(set.has("behavior") ? ["acceptance path"] : []),
      ...(set.has("docs") ? ["docs synced"] : []),
    ],
    rollback: [
      ...(set.has("schema") ? ["backward-compatible rollback"] : []),
      ...(set.has("deployment") ? ["traffic rollback"] : []),
    ],
  };
}
