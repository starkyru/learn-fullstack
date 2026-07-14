# Module 00b — Git, Collaboration & Change Delivery (companion)

> **Depth lanes** 🟢 App · 🟡 Balanced · 🔴 Deep · **Task types** WE / TODO / FS / EXT
> Take this immediately after Module 00. It makes every later exercise reviewable and recoverable.

Git is not clerical work around programming: it is the collaboration, recovery, and release history
of a production codebase. Practice small commits, a reviewable pull request, and a safe recovery
path before the capstones make those habits expensive to learn.

## Concepts

- **Small, reversible commits** — one intention per commit; use `git diff`, `git status`, and
  `git restore --staged` before committing. A Conventional Commit is useful searchable metadata,
  not a substitute for a clear body.
- **Branch and merge discipline** — branch from an updated base; rebase your private branch; merge
  a reviewed PR. Never rebase a branch other people may have based work on.
- **Conflict recovery** — inspect both sides, run the relevant tests after resolving, then continue
  or abort. `revert` makes a safe public undo; `reset` rewrites local history.
- **Review as a test layer** — a PR states intent, risk, verification, and rollback. CI passing is
  necessary but does not replace reviewing the behavior and migration/deploy plan.

## Tasks

| #   | Task                        | Lane | Type | What you build                                                                                          |
| --- | --------------------------- | ---- | ---- | ------------------------------------------------------------------------------------------------------- |
| 1   | Commit metadata             | 🟢   | WE   | solved parser for a Conventional Commit + analog `formatCommitSubject`                                  |
| 2   | Reviewable PR plan          | 🟡   | TODO | derive the required review/verification/rollback checklist from a change set                            |
| 3   | Conflict and recovery drill | 🔴   | FS   | create a deliberate conflict, resolve it, then use `revert` to undo it without rewriting public history |

## Done when

- [ ] `formatCommitSubject` preserves the type/scope/breaking marker and rejects an empty subject.
- [ ] Your PR checklist requires migration ordering for schema changes, tests for behavior changes,
      and a rollback for production-impacting changes.
- [ ] You can explain when to use `rebase`, `merge`, `revert`, and `reset`, and have completed the
      conflict/revert drill in a throwaway branch.

> Task 1 is a worked example; task 2 is a cold TODO; task 3 is a terminal drill rather than a
> library exercise. Tests import `solution/`; use `pnpm grade 00b-git-collaboration` for your work.
