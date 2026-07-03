---
name: project_course_structure
description: learn-fullstack is a teaching course repo, not a product — review lens is pedagogy/template-soundness, not prod security
type: project
---

`learn-fullstack` (this repo) is a personal, hands-on full-stack TypeScript teaching
course, not a production app. `AGENTS.md` defines the
canonical per-module template: `README.md` (concepts + task table tagged with a depth
lane 🟢/🟡/🔴 and task-type WE/TODO/FS/EXT + "Done when" checklist) + `src/` (learner
edits; WE references fully implemented, TODO/FS target fns are stubs that
`throw new Error("TODO…")`) + `solution/` (reference impls) + `test/` (imports the
reference from `solution/`, so CI proves the exercise is solvable while the learner
works in `src/`).

**Build is COMPLETE (2026-07-03):** all 44 lessons (00–29 + 14 companions) are
implemented, adversary-reviewed, mutation-verified, and committed; the 4 capstone apps
under `apps/` are M0 vertical slices only (M1–M6 documented as TODO in each app README).
Modules 00/01 were the original template replicated via `scaffold-module` — pattern-level
flaws still matter most since new modules copy the template.

**How to verify this repo's gating model** (don't just read — run it):

- `pnpm turbo run typecheck --filter=./modules/<id>` and
  `pnpm turbo run test --filter=./modules/<id>` — the documented/correct way to run
  things; resolves `^build` for workspace `@learn-fullstack/*` deps first.
- `npx tsx /path/to/stub.ts`-style direct execution (or a tiny throwaway `.mjs` that
  imports the stub) to confirm a `src/*.ts` stub function actually throws at runtime,
  not just that it typechecks.
- Temporarily flip a test's `../solution/x.js` import to `../src/x.js` and rerun vitest
  directly to confirm it fails red against an unsolved stub (this is the "flip the
  import to grade yourself" workflow the READMEs describe) — then restore the file.
- `npx eslint modules/<id>` — root `eslint.config.mjs` + `packages/eslint-config`
  already special-case `modules/*/src/**` to turn off `no-unused-vars` for intentionally
  blank stub params (`_key`, `_shape`, …), while `solution/`+`test/` stay fully linted.
  This was a deliberate, correct scalability decision — don't re-flag it as an issue.
- `npx tsx scripts/docs-sync.ts` — CI check that a `modules/NN-*` folder is _mentioned_
  by id in both root `README.md` and `CURRICULUM.md`. **Important limitation**: it only
  regex-checks the module id token + task-table column-2 titles appear in each doc — it
  does NOT diff column 4 (Build/description) or the "Done when" list, which can drift
  silently. See [[review_lessons]] point 3.

See [[review_lessons]] for the transferable adversarial-review heuristics distilled from
all the 2026-07-02/03 module reviews (every specific defect found is now fixed +
mutation-verified). Note the docs-sync limitation there: it only diffs task-title
(column 2), not the Build/description column.
