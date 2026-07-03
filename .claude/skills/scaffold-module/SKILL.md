---
name: scaffold-module
description: >-
  Generate a new learn-fullstack module or companion in exact house style — README (concepts
  + a numbered task table tagged with depth lanes 🟢/🟡/🔴 and types WE/TODO/FS/EXT + a
  "Done when" checklist), src/ scaffolds (worked-example reference + analog stub, hint-only
  cold/from-scratch stubs that throw TODO), tests that import the real solution with
  hand-written expected values, and full docs wiring (README + CURRICULUM + PROGRESS). Use
  when the learner or jd-gap-analysis wants to add a topic. Verifies by temp-filling stubs,
  running typecheck+tests, then reverting the fills.
argument-hint: "<topic> [--after <id>] [--companion]"
---

You generate a new module in the exact house style so it drops into the monorepo and passes
`scripts/docs-sync.ts`. Requested: `$ARGUMENTS`.

## Step 1 — Confirm placement & read a template

Pick the id/slug and placement (`--after <id>` → next number; `--companion` → a lettered
sibling like `14b`). Read a neighboring module as the template — a from-scratch 🔴 one
(`modules/13b-mini-store`) for logic modules, `modules/17-express` for node, `modules/18-nestjs`
for Nest — and mirror its `package.json`, `tsconfig.json`, `vitest.config.ts`, `test/setup.ts`.

## Step 2 — Draft the README

`# Module <id> — <Title> <lane>` · the `> Depth lanes … Task types …` note · `## Concepts` ·
a `## Tasks` table `| # | Task | Lane | Type | Build |` · `## Done when` checklist. Mix the
four task types; at least one 🔴 FS task that **names the forbidden library**. The Task column
titles become the source of truth for docs-sync.

## Step 3 — Generate scaffolds

- **WE**: a fully-solved reference in BOTH `src/` and `solution/`, plus an analog sibling that
  is a throwing stub in `src/` and solved in `solution/`.
- **TODO / FS 🔴**: `solution/` solved; `src/` is a stub whose core fn `throw new Error("TODO: …")`
  — keep the exported signature/types/return SHAPE + numbered step hints in the docstring;
  remove the assembled body + final return. Only edit comments on unimplemented stubs.
- **EXT**: `src/` mirrors `solution/`.
- `test/NN-*.test.ts` import from `../solution/NN-*.js` and exercise the REAL code; expected
  values are hand-written / independently derived (**never** computed via the code path under
  test — no tautologies); assertions are discriminating (exact output/shape). Mock only true
  external boundaries. Inject the clock/entropy (no `Date.now`/`Math.random`). UI → add
  `*.stories.tsx`.

## Step 4 — Wire the workspace

`package.json` name `@learn-fullstack/mod-<id>-<slug>`, catalog deps; `pnpm install`;
`pnpm turbo run typecheck test --filter=./modules/<id>-<slug>`.

## Step 5 — Keep docs in sync (HARD RULE)

Add the module to `README.md` (table + companions line), a `### <id> — <Title>` section in
`CURRICULUM.md` **with the same task-column titles as the module README**, and a row in
`PROGRESS.md`. Run `pnpm tsx scripts/docs-sync.ts` — it must pass.

## Step 6 — Verify, then hand clean stubs back

Temporarily fill each `src/` stub, run `typecheck` + `test` green (proving the exercise is
solvable and the tests are real), then **revert the fills** so the learner receives clean
throwing stubs. Leave `solution/` and `test/` in place.

## Rules

- Hint, don't hand over — cold/🔴 stubs keep the shape and steps, not the answer.
- docs-sync must pass (README task titles === CURRICULUM section task titles, verbatim).
- Tests import the real code; hand-written expecteds; discriminating assertions; boundary-only
  mocks. Never leave a temp stub-fill committed.
