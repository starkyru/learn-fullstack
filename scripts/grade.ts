/**
 * Self-grade a module against YOUR `src/` instead of the gated `solution/`.
 *
 * Tests import from `../solution/…` so the suite is green out of the box (it grades the
 * answer key, not your work). This script temporarily flips those imports to `../src/…`,
 * runs the module's test suite, then ALWAYS restores the originals — so a green here means
 * your code passed, and your test files are left untouched.
 *
 * Usage: `pnpm grade 01-typescript`  (or `tsx scripts/grade.ts 01-typescript`)
 */
import { spawnSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const arg = process.argv[2];
if (!arg) {
  console.error("Usage: pnpm grade <module>   e.g. pnpm grade 01-typescript");
  process.exit(2);
}

// Accept "01-typescript" or "modules/01-typescript"; reject anything else so the arg
// can't escape modules/ (no path traversal).
const name = arg.replace(/^modules\//, "").replace(/\/$/, "");
if (!/^[0-9]{2}[a-z]?-[a-z0-9-]+$/.test(name)) {
  console.error(`Not a valid module id: "${arg}" (expected e.g. 01-typescript).`);
  process.exit(2);
}

const moduleDir = join("modules", name);
const testDir = join(moduleDir, "test");
if (!existsSync(testDir)) {
  console.error(`No test dir at ${testDir}.`);
  process.exit(2);
}

/** All *.test.ts / *.test.tsx under a module's test/ (recursively). */
function testFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry);
    if (statSync(p).isDirectory()) out.push(...testFiles(p));
    else if (/\.test\.tsx?$/.test(entry)) out.push(p);
  }
  return out;
}

const files = testFiles(testDir);
// Save originals so we can restore no matter how the run exits.
const originals = new Map<string, string>();
for (const f of files) originals.set(f, readFileSync(f, "utf8"));

function restore(): void {
  for (const [f, content] of originals) writeFileSync(f, content);
}
// Restore on Ctrl-C / kill too, not just normal completion.
for (const sig of ["SIGINT", "SIGTERM"] as const) {
  process.on(sig, () => {
    restore();
    process.exit(130);
  });
}

let flipped = 0;
for (const [f, content] of originals) {
  // Only rewrite relative imports that point at the gated solution.
  const graded = content.replace(/(\.\.\/)+solution\//g, (m) => m.replace("solution/", "src/"));
  if (graded !== content) {
    writeFileSync(f, graded);
    flipped += 1;
  }
}

if (flipped === 0) {
  restore();
  console.error(
    `No "../solution/" imports found in ${testDir} — nothing to grade against src/.`,
  );
  process.exit(2);
}

console.log(`Grading ${name} against src/ (${flipped} test file(s) flipped)…\n`);
const res = spawnSync("pnpm", ["--filter", `./${moduleDir}`, "test"], {
  stdio: "inherit",
});

restore();
process.exit(res.status ?? 1);
