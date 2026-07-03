# Module 01 — TypeScript for Full-Stack

> **Depth lanes** 🟢 App · 🟡 Balanced · 🔴 Deep · **Task types** WE / TODO / FS / EXT

Master the slice of the type system that makes a full-stack app safe end-to-end: modeling
data so illegal states don't compile, and letting one zod schema be the single source of
truth shared by client and server.

## Concepts

- **Discriminated unions + narrowing** — a `kind`/`type` tag lets the compiler know which
  variant you hold; `switch` on it and TypeScript narrows each branch. Add
  `assertNever(x: never)` in the `default` to make a missing case a **compile error**.
- **Generics & utility types** — write functions/types once over many shapes (`pick`,
  `Result<T, E>`); `Partial`, `Pick`, `Record`, `ReturnType` are built from the same idea.
- **`satisfies`** — validate a value against a type _without widening_ it, so you keep the
  literal types.
- **Zod as the source of truth** — define the schema once, `z.infer` the type from it, and
  both the API and the UI validate/type against the same object. See
  `@learn-fullstack/shared`.

## Tasks

| #   | Task                 | Lane | Type | What you build                                                                 |
| --- | -------------------- | ---- | ---- | ------------------------------------------------------------------------------ |
| 1   | Model & narrow       | 🟢   | WE   | `area()` is solved; write the analog `label()` over the same `Shape` union     |
| 2   | Generic helpers      | 🟡   | TODO | `pick(obj, keys)` and a `Result<T, E>` `ok`/`err` pair — no `any`              |
| 3   | One schema, two ends | 🟢   | WE   | `parseUser()` is solved (uses `@learn-fullstack/shared`); write `parseLogin()` |
| 4   | Exhaustiveness 🔴    | 🔴   | FS   | `assertNever` so adding a `Shape` variant fails to compile until handled       |

## Done when

- [ ] `pnpm --filter ./modules/01-typescript typecheck` is clean under `strict` (no `any`).
- [ ] `label()` returns the right string for every `Shape`; `pick` is fully typed.
- [ ] `parseLogin()` accepts a valid login and rejects a short password.
- [ ] Adding a new `Shape` variant makes task 4 fail to compile until you handle it.

> Worked-example tasks show a solved reference in `src/`; you complete the sibling stub.
> Tests import the reference from `solution/` — flip to `../src/...` to grade your own work.
