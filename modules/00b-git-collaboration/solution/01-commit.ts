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

export function formatCommitSubject(commit: Commit): string {
  if (!commit.subject.trim()) throw new Error("commit subject is required");
  return `${commit.type}${commit.scope ? `(${commit.scope})` : ""}${commit.breaking ? "!" : ""}: ${commit.subject}`;
}
