export type Change = "schema" | "behavior" | "deployment" | "docs";
export type PullRequestChecklist = {
  review: string[];
  verify: string[];
  rollback: string[];
};

/** Turn a declared change set into the minimum safe pull-request checklist. */
export function buildPullRequestChecklist(_changes: Change[]): PullRequestChecklist {
  throw new Error(
    "TODO: require review, verification, and rollback items that match each change type",
  );
}
