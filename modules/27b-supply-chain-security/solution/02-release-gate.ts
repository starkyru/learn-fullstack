export type ReleaseEvidence = {
  audit: boolean;
  sbom: boolean;
  secretScan: boolean;
  e2e: boolean;
  migrationPlan: boolean;
};
const LABELS: Record<keyof ReleaseEvidence, string> = {
  audit: "dependency audit",
  sbom: "SBOM",
  secretScan: "secret scan",
  e2e: "browser E2E",
  migrationPlan: "migration and rollback plan",
};
export function missingReleaseEvidence(evidence: ReleaseEvidence): string[] {
  return (Object.keys(LABELS) as (keyof ReleaseEvidence)[])
    .filter((key) => !evidence[key])
    .map((key) => LABELS[key]);
}
