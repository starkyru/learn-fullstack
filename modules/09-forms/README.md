# Module 09 — Forms

> **Depth lanes** 🟢 App · 🟡 Balanced · 🔴 Deep · **Task types** WE / TODO / FS / EXT

Validated, accessible forms the production way — from a hand-rolled controlled form up to
the two libraries you'll actually reach for, and how to surface **server** errors the client
can't predict.

## Concepts

- **Controlled vs uncontrolled** — controlled inputs hold their value in React state (every
  keystroke re-renders); uncontrolled inputs live in the DOM and are read via refs/`register`.
- **zod as the single source of truth** — one schema validates and _infers_ the value type;
  `safeParse` → collapse `error.issues` into a `{ field -> message }` map.
- **React Hook Form** — uncontrolled by default (fast), `zodResolver` bridges the schema,
  `useFieldArray` drives dynamic lists (tags), errors live on `formState.errors`.
- **TanStack Form** — fully-controlled, per-field validators keyed by cause
  (`onChange`/`onSubmit`), errors are a plain `string[]`. Compare the ergonomics vs RHF.
- **Async + server errors** — client validation is necessary but not sufficient; map a
  rejected submit onto the offending field (`setError`) and keep a form-level fallback.
- **Accessibility** — every `<input>` linked to a `<label htmlFor>`; each message in a
  `role="alert"` so it's announced.

## Tasks

| #   | Task                  | Lane | Type | What you build                                                    |
| --- | --------------------- | ---- | ---- | ----------------------------------------------------------------- |
| 1   | Controlled form + zod | 🟢   | WE   | solved `<LoginForm>` (zod) + analog `<SignupForm>` stub           |
| 2   | React Hook Form       | 🟡   | TODO | a "new card" form with RHF + `zodResolver` + a tag field array    |
| 3   | TanStack Form         | 🟢   | TODO | rebuild the card form with TanStack Form; note the tradeoffs      |
| 4   | Async + server errors | 🟡   | EXT  | map a rejected `ServerValidationError` back onto the right fields |

## Done when

- [ ] `<SignupForm>` blocks submit with per-field messages; the mismatch message lands on the
      confirm-password field (the `refine` `path`), and a valid submit calls `onSubmit`.
- [ ] `<NewCardForm>` blocks submit on the resolver's title error, appends/removes tag inputs
      via the field array, and submits the typed `{ title, tags }` shape.
- [ ] the TanStack version validates and blocks submit the same way, then submits its values —
      and you can state one ergonomic tradeoff vs RHF.
- [ ] a rejected `ServerValidationError` shows on the offending field, a non-validation error
      shows a form-level message, and neither calls `onSuccess`; a resolved submit does.

> Worked-example tasks show a solved reference in `src/`; you complete the sibling stub.
> Tests import the reference from `solution/` — flip to `../src/...` to grade your own work.
