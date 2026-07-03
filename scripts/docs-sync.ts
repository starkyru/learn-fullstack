/**
 * Enforces the "keep docs in sync" hard rule (see AGENTS.md). Fails if:
 *   (a) a modules/NN-* folder is not referenced in BOTH README.md and CURRICULUM.md, or
 *   (b) a built module's task-table titles disagree between its own README.md and its
 *       CURRICULUM.md section (catches silent content drift, not just id presence).
 * Run in CI.
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const MODULES_DIR = "modules";
const MODULE_RE = /^(\d{2}[a-z]?)-/;

function moduleDirs(): { id: string; dir: string }[] {
  if (!existsSync(MODULES_DIR)) return [];
  return readdirSync(MODULES_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory() && MODULE_RE.test(d.name))
    .map((d) => ({ id: d.name.match(MODULE_RE)![1]!, dir: d.name }));
}

// A module id must appear as a standalone token — not as a digit substring of a year
// ("2026" must not satisfy "02") nor as a prefix of a companion ("05b" must not satisfy "05").
function mentions(doc: string, id: string): boolean {
  return new RegExp(`(?<![0-9A-Za-z])${id}(?![0-9A-Za-z])`).test(doc);
}

// The task-table's column-2 titles, in order (rows look like `| 1 | Title | 🟢 | WE | … |`).
function taskTitles(markdown: string): string[] {
  return markdown
    .split("\n")
    .filter((line) => /^\|\s*\d+\s*\|/.test(line))
    .map((line) => line.split("|")[2]?.trim() ?? "");
}

// The CURRICULUM section for `id`: from its `### NN —` heading to the next `### ` heading.
function curriculumSection(curriculum: string, id: string): string | null {
  const lines = curriculum.split("\n");
  const start = lines.findIndex((l) => new RegExp(`^### ${id} `).test(l));
  if (start === -1) return null;
  let end = lines.length;
  for (let i = start + 1; i < lines.length; i++) {
    if (lines[i]!.startsWith("### ")) {
      end = i;
      break;
    }
  }
  return lines.slice(start, end).join("\n");
}

const readme = existsSync("README.md") ? readFileSync("README.md", "utf8") : "";
const curriculum = existsSync("CURRICULUM.md")
  ? readFileSync("CURRICULUM.md", "utf8")
  : "";

const problems: string[] = [];
for (const { id, dir } of moduleDirs()) {
  if (!mentions(readme, id)) problems.push(`  - module ${id}: missing from README.md`);
  if (!mentions(curriculum, id))
    problems.push(`  - module ${id}: missing from CURRICULUM.md`);

  const readmePath = join(MODULES_DIR, dir, "README.md");
  if (!existsSync(readmePath)) continue;

  const moduleTasks = taskTitles(readFileSync(readmePath, "utf8"));
  const section = curriculumSection(curriculum, id);
  if (section === null) {
    problems.push(`  - module ${id}: no "### ${id} —" section in CURRICULUM.md`);
    continue;
  }
  const curriculumTasks = taskTitles(section);
  if (JSON.stringify(moduleTasks) !== JSON.stringify(curriculumTasks)) {
    problems.push(
      `  - module ${id}: task titles differ between its README and CURRICULUM.md\n` +
        `      module README: ${JSON.stringify(moduleTasks)}\n` +
        `      CURRICULUM.md: ${JSON.stringify(curriculumTasks)}`,
    );
  }
}

if (problems.length > 0) {
  console.error("docs-sync: problems found:\n" + problems.join("\n"));
  process.exit(1);
}
console.log(`docs-sync: OK (${moduleDirs().length} module folders checked).`);
