export type ReleaseEvidence = {
  audit: boolean;
  sbom: boolean;
  secretScan: boolean;
  e2e: boolean;
  migrationPlan: boolean;
};
export function missingReleaseEvidence(_evidence: ReleaseEvidence): string[] {
  throw new Error(
    "TODO: return stable human-readable names for every missing release prerequisite",
  );
}
