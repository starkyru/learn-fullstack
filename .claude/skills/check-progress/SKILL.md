---
name: check-progress
description: >-
  Report the learner's progress through learn-fullstack. Reads PROGRESS.md, resolves
  modules under modules/*, runs per-module typecheck + tests via pnpm/turbo, greps each
  src/ for unfinished stubs (TODO / throw new Error("TODO") / NotImplemented / @stub),
  and reconciles the self-report against those real signals. Use when the learner asks
  "where am I", "what's next", "how much is left", "am I done with module X", "check my
  progress". Outputs overall %, a per-module status table, the next task, weak areas, and
  pointers to /tutor and /exam. Offers to update PROGRESS.md with detected status.
argument-hint: '[module# or range, optional] (e.g. "", "14", "00-08")'
---

You reconcile the learner's **self-report** against **real signals** for the
`learn-fullstack` course, then report where they are. Trust signals over the self-report
and over README checkboxes — surfacing drift is the whole point.

## Step 1 — Read the self-report

Read `PROGRESS.md` at the repo root. Schema: a header (`Learner`, `Default lane`,
`Current module`, `Last checked`) then one row per lesson —
`| Module | Lane | Status | Confidence | Notes |` with Status ∈ {not-started,
in-progress, done} and Confidence ∈ 1–5. It covers all 44 lessons (00, 01, 02, 03, 04, 05,
05b, 05c, 06, 07, 07b, 08, 08b, 09, 10, 10b, 11, 11b, 12, 13, 13b, 14, 14b, 15, 16, 17, 18,
19, 20, 20b, 21, 21b, 22, 23, 23b, 24, 24b, 25, 26, 27, 28, 28b, 28c, 29). If it is missing,
create it from that template (one `not-started` row per `modules/*`) and continue.

For a quick headline you may run `pnpm tsx scripts/progress.ts` (reads PROGRESS.md and
prints `% done`), but do the real reconciliation below yourself.

## Step 2 — Resolve modules on disk

For each `modules/<id>-<slug>/` in scope (all, or the `$ARGUMENTS` module / range), read the
`README.md`: parse the task table (`#`, depth 🟢/🟡/🔴, type WE/TODO/FS/EXT) and the
`## Done when` checklist. Worked-example (WE) reference halves ship solved and carry no stub.

## Step 3 — Run real signals (per module in scope)

- Typecheck: `pnpm turbo run typecheck --filter=./modules/<id>-<slug>...`
- Tests: `pnpm --filter ./modules/<id>-<slug> test` → capture `tests: <passed>/<total>`.

Slow app-integration modules (Testcontainers/Postgres in 15, 26; the module 26 e2e/
Playwright artifact) only run when **in range** _and_ the self-status is in-progress/done;
otherwise record `not-run (slow e2e)`. Never crash on a setup error (no Docker/PG) — record
the reason and move on.

## Step 4 — Grep for stubs

Count `TODO` / `throw new Error("TODO` / `NotImplemented` / `@stub` under each module's
`src/`, excluding `*.stories.*`, `*.test.*`, `dist/`. Map hits to tasks. A `src/NN-*` that
still throws `TODO` = that task is unfinished. Tests import from `solution/`, so a green
suite with throwing `src/` stubs means "reference works, learner hasn't done it yet."

## Step 5 — Derive status

A **task** is done when its `src/` file has 0 stub markers **and** the module typechecks
**and** tests pass (or n/a). Module = done / in-progress / not-started. **⚠ drift** =
self-status `done` but reality disagrees (still-throwing stub, failing typecheck/tests).
**Overall % = doneTasks / totalTasks** (task-weighted, not module-weighted).

## Step 6 — Output

- Headline: `Overall: NN% (X/Y tasks, M/N modules)`.
- Per-module table: `Module | Lane | Self | Detected | Typecheck | Tests | Stubs | Flag`.
- **Your next task**: the first not-started/in-progress task + the exact command to run it
  (`pnpm --filter ./modules/<id> test`, `pnpm tsx modules/<id>/src/<file>.ts`).
- **Weak areas**: drift, failing modules, low-confidence-with-stubs — named by concept.
- **Study pointer**: `/tutor <id> <question>` and `/exam <id>`.

## Step 7 — Offer to update PROGRESS.md

Offer to write detected statuses + bump `Last checked` (today's date) and append a dated
drift note. Show the diff first. **Never** overwrite the learner's `Confidence` or free-text
`Notes`.

## Rules

- Signals over vibes — always cite the number (`tests 3/5`, `2 stubs`).
- Never mark done what doesn't pass — drift is the signal, not an error to hide.
- e2e / Testcontainers are opt-in (in-range + self in-progress/done).
- Read + report only; the **only** file you may write is `PROGRESS.md` (with consent).
