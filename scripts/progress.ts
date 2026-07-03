/**
 * CLI the /progress skill wraps. Phase 0: reads PROGRESS.md and prints a summary.
 * Phase 3 adds per-module typecheck/test runs + stub grep + drift detection.
 */
import { existsSync, readFileSync } from "node:fs";

type Status = "done" | "in-progress" | "not-started";

if (!existsSync("PROGRESS.md")) {
  console.log(
    "No PROGRESS.md yet. Run the /progress skill or create it from the template.",
  );
  process.exit(0);
}

const rows = readFileSync("PROGRESS.md", "utf8")
  .split("\n")
  .filter((l) => /^\|\s*\d{2}[a-z]?/.test(l));

const counts: Record<Status, number> = { done: 0, "in-progress": 0, "not-started": 0 };
for (const row of rows) {
  const status = (row.split("|")[3] ?? "").trim();
  if (status === "done" || status === "in-progress" || status === "not-started") {
    counts[status] += 1;
  }
}

const total = rows.length || 1;
const pct = Math.round((counts.done / total) * 100);
console.log(`Progress: ${pct}% (${counts.done}/${total} modules done).`);
console.log(
  `  in-progress: ${counts["in-progress"]}, not-started: ${counts["not-started"]}`,
);
console.log("Full report (typecheck/tests/stub-grep + drift) — run the /progress skill.");
