export type Commit = { type: string; scope?: string; breaking: boolean; subject: string };

export function parseCommitSubject(subject: string): Commit {
  const match = /^(feat|fix|docs|test|refactor|chore)(?:\(([^)]+)\))?(!)?: (.+)$/.exec(
    subject,
  );
  if (!match) throw new Error("invalid Conventional Commit subject");
  return {
    type: match[1]!,
    scope: match[2] || undefined,
    breaking: Boolean(match[3]),
    subject: match[4]!,
  };
}

/** Format a parsed commit for a PR title. Preserve the optional scope and breaking marker. */
export function formatCommitSubject(_commit: Commit): string {
  throw new Error(
    "TODO: format the type, optional scope, breaking marker, and non-empty subject",
  );
}
