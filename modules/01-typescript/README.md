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
- **`as const`** — a const assertion freezes a value to its _literal_ types and makes it
  `readonly`, so `["a","b"] as const` becomes the tuple `readonly ["a","b"]` and you can
  derive a union with `(typeof arr)[number]`.
- **`satisfies`** — validate a value against a type _without widening_ it, so you keep the
  literal keys/types (unlike a `: Type` annotation, which widens them).
- **Type guards** — a user-defined predicate `(x): x is T` narrows a value after a runtime
  check, so `arr.filter(isDefined)` drops `null | undefined` at the type level too.
- **`keyof` & indexed access** — `K extends keyof T` + a return type of `T[K]` gives you a
  getter that stays typed per key instead of collapsing to `any`.
- **Mapped & template-literal types** — remap a type's keys (`[K in keyof T as ...]`) and
  build new string-literal keys (`` `get${Capitalize<K>}` ``) — how libraries derive types.
- **Zod as the source of truth** — define the schema once, `z.infer` the type from it, and
  both the API and the UI validate/type against the same object. See
  `@learn-fullstack/shared`.

## Tasks

| #   | Task                       | Lane | Type | What you build                                                                  |
| --- | -------------------------- | ---- | ---- | ------------------------------------------------------------------------------- |
| 1   | Model & narrow             | 🟢   | WE   | `area()` is solved; write the analog `label()` over the same `Shape` union      |
| 2   | Generic helpers            | 🟡   | TODO | `pick(obj, keys)` and a `Result<T, E>` `ok`/`err` pair — no `any`               |
| 3   | One schema, two ends       | 🟢   | WE   | `parseUser()` is solved (uses `@learn-fullstack/shared`); write `parseLogin()`  |
| 4   | Exhaustiveness 🔴          | 🔴   | FS   | `assertNever` so adding a `Shape` variant fails to compile until handled        |
| 5   | Const assertions           | 🟢   | WE   | `indexOfLevel()` is solved; const-assert `PRIORITIES` and write `rankOf()`      |
| 6   | Validate without widening  | 🟡   | WE   | `endpoint()` is solved; add `satisfies` to `THEME` and write `colorOf()`        |
| 7   | Utility types              | 🟡   | TODO | `applyPatch()` with `Partial<T>` and `indexById()` returning `Record<string,T>` |
| 8   | Type guards                | 🟢   | WE   | `isDefined`/`compact` are solved; write the `isString(x): x is string` analog   |
| 9   | Typed property access      | 🟡   | TODO | `getProp(obj, key): T[K]` and `pluck(items, key): T[K][]` via `keyof`           |
| 10  | Mapped & template types 🔴 | 🔴   | FS   | `Getters<T>` remaps keys to `` `get${Capitalize<K>}` `` + `makeGetters()`       |

## Theory & docs

- **Model & narrow** — [Narrowing (TS Handbook)](https://www.typescriptlang.org/docs/handbook/2/narrowing.html),
  [Everyday Types (TS Handbook)](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html)
- **Generic helpers** — [Generics (TS Handbook)](https://www.typescriptlang.org/docs/handbook/2/generics.html)
- **One schema, two ends** — [Zod docs](https://zod.dev/)
- **Exhaustiveness 🔴** — [Exhaustiveness checking (TS Handbook)](https://www.typescriptlang.org/docs/handbook/2/narrowing.html#exhaustiveness-checking)
- **Const assertions** — [const assertions (TS 3.4 notes)](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-3-4.html#const-assertions)
- **Validate without widening** — [The `satisfies` operator (TS 4.9 notes)](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-4-9.html)
- **Utility types** — [Utility Types (TS Handbook)](https://www.typescriptlang.org/docs/handbook/utility-types.html)
- **Type guards** — [Type predicates (TS Handbook)](https://www.typescriptlang.org/docs/handbook/2/narrowing.html#using-type-predicates)
- **Typed property access** — [Keyof Type Operator (TS Handbook)](https://www.typescriptlang.org/docs/handbook/2/keyof-types.html),
  [Indexed Access Types (TS Handbook)](https://www.typescriptlang.org/docs/handbook/2/indexed-access-types.html)
- **Mapped & template types 🔴** — [Mapped Types (TS Handbook)](https://www.typescriptlang.org/docs/handbook/2/mapped-types.html),
  [Template Literal Types (TS Handbook)](https://www.typescriptlang.org/docs/handbook/2/template-literal-types.html)

## Done when

- [ ] `pnpm --filter ./modules/01-typescript typecheck` is clean under `strict` (no `any`).
- [ ] `label()` returns the right string for every `Shape`; `pick` is fully typed.
- [ ] `parseLogin()` accepts a valid login and rejects a short password.
- [ ] Adding a new `Shape` variant makes task 4 fail to compile until you handle it.
- [ ] `rankOf()` returns 1/2/3 over a const-asserted `PRIORITIES`; `colorOf()` returns the hex.
- [ ] `applyPatch()`/`indexById()` are typed with `Partial`/`Record`; `isString` narrows `unknown`.
- [ ] `getProp`/`pluck` return `T[K]`/`T[K][]`; `makeGetters({id}).getId()` returns the value.

> Worked-example tasks show a solved reference in `src/`; you complete the sibling stub.
> Tests import the reference from `solution/` — flip to `../src/...` to grade your own work.
