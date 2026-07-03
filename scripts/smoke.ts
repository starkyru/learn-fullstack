/**
 * Cheap sanity check: every modules/NN-* folder has a README.md and a src/ dir.
 * Deeper checks (stubs typecheck, gated solutions pass) are added in Phase 5.
 */
import { readdirSync, existsSync } from "node:fs";
import { join } from "node:path";

const MODULES_DIR = "modules";
let failed = 0;

if (existsSync(MODULES_DIR)) {
  for (const d of readdirSync(MODULES_DIR, { withFileTypes: true })) {
    if (!d.isDirectory() || !/^\d{2}[a-z]?-/.test(d.name)) continue;
    for (const req of ["README.md", "src"]) {
      if (!existsSync(join(MODULES_DIR, d.name, req))) {
        console.error(`smoke: ${d.name} is missing ${req}`);
        failed += 1;
      }
    }
  }
}

if (failed > 0) process.exit(1);
console.log("smoke: OK");
