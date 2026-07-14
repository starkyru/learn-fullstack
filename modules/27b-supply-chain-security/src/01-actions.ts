/** GitHub Actions references should be a reviewed immutable 40-character commit SHA. */
export function isPinnedAction(_reference: string): boolean {
  throw new Error(
    "TODO: accept owner/repo@<40 hex chars>; reject tags and malformed references",
  );
}
