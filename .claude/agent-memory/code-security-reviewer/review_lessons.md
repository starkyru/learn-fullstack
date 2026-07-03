---
name: review_lessons
description: Transferable adversarial-review heuristics for learn-fullstack modules — green CI is not proof; how to probe solutions and detect toothless tests
type: project
---

Consolidated from the 2026-07-02/03 module reviews (00/01, 02–04, 09, 10, 11, 13, 28c).
Every specific defect those reviews found has since been fixed **and mutation-verified**;
what survives here is the reusable technique. When reviewing a future module, apply these
before flagging — and re-derive, don't trust a stale per-module note.

**1. Green CI ≠ correct `solution/`.** `turbo typecheck` + `vitest` + `eslint` + `docs:sync`
all passing does NOT prove a reference solution is correct — the tests usually exercise only
the happy path the task text names literally. Adversarially **execute the real exported
solution** (throwaway script/test importing from `solution/`, never reimplemented logic)
against the classic edge case for that primitive:

- string/stream transforms → **multi-byte UTF-8 split across a chunk boundary** (use
  `node:string_decoder` StringDecoder; per-chunk `.toString("utf8")` corrupts).
- key→path (caches, file stores) → **path traversal** via `../` in the key (encode/hash it).
- file reads/parses → **corrupt/adversarial content** (JSON.parse must be caught → spec
  return, not throw).
- emitters → **reentrant `.on()` during `emit`** (iterate a snapshot `[...list]`, not the
  live array).
- form server-error mapping → **empty `{}` or unknown-key `fieldErrors`** (must fall back to
  a visible form-level `root` error, else silent swallow).
- TTL/boundary values, 0-item / items<concurrency for `pMap`, dedupe-on-failure.

**2. Concurrent-feature tests are silently toothless.** For modules using
`useDeferredValue` / `useTransition` / `useOptimistic` / `startTransition`, RTL's
`waitFor`/`findBy*` naturally converge PAST the transient state the hook exists to produce —
so a suite can stay green even if the hook is deleted. **Mutation-test**: strip the hook out
of `solution/`, keep everything else, rerun the suite; if still green, the test doesn't cover
the hook. A discriminating test asserts the transient state directly — `aria-busy="true"`
while the transition is pending, the optimistic row present _before_ the mocked promise
resolves — not just the converged final DOM.

**3. `docs-sync.ts` only diffs task-title (column 2), not the Build/description (column 4).**
It regex-extracts each README task-row title and fails if it doesn't match the `### NN —`
CURRICULUM section title. It does NOT diff column 4, the "Done when" list, or the Concepts
line — those can drift silently (e.g. CURRICULUM promising "large file / prove backpressure"
while the test pipes short in-memory strings). Diff column 4 by hand; `docs-sync: OK` means
titles match, not that the row matches.

**4. Close-the-gap cadence.** After adding a missing test to close a surviving-mutation gap,
**mutation-verify it**: re-introduce the bug/delete the real code and confirm the new test
fails red, then restore. A test added without this step may itself be toothless.

See [[project_course_structure]] for how to actually run the gating model (turbo/tsx/eslint).
