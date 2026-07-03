# Module 25 — Server Actions & Full-Stack Next

> **Depth lanes** 🟢 App · 🟡 Balanced · 🔴 Deep · **Task types** WE / TODO / FS / EXT

Server Actions are the full-stack seam of the Next.js App Router: a form submits straight to a
server function, no route handler in between. This module builds that seam the testable way —
the action LOGIC lives in plain functions with injected boundaries (`repo`, `revalidate`,
`session`), so you exercise it with fakes and a `Request`, never a running Next server. On the
client you wire the React 19 form primitives (`useActionState`, `useOptimistic`) that make those
actions feel instant and progressively enhanced.

## Concepts

- **A Server Action is a mutation function, not an endpoint** — write the core as
  `createCardAction(input, deps)` that validates with zod, calls `deps.repo`, then
  `deps.revalidate("cards")` to bust the cache tag. A thin `"use server"` wrapper binds the real
  repo + `revalidateTag`; tests bind fakes. It returns `{ ok, card }` / `{ ok: false, error }`
  instead of throwing, because the form has to render the outcome.
- **`useActionState` wires a form to an action** — `[state, formAction, isPending]`. Point
  `<form action={formAction}>` at it; React posts the `FormData`, stores the return as `state`,
  and flips `isPending` while in-flight. It works before hydration, which is the progressive-
  enhancement win, and `isPending` / `state` drive the pending + error/success UI.
- **`useOptimistic` shows the result before the server confirms** — render an optimistic layer
  the instant the user acts (inside a transition/action), then commit the authoritative list the
  action returns on settle. React drops the optimistic layer when the action ends, so a move the
  server rejects reconciles back for free.
- **Every mutation wears an auth envelope** — `withAuth` gates the action on an Auth.js session
  (and role), then zod-validates the untrusted input, before the core action ever runs.
  Unauthorized or invalid calls return early and never touch the database.

## Tasks

| #   | Task                     | Lane | Type | What you build                                              |
| --- | ------------------------ | ---- | ---- | ----------------------------------------------------------- |
| 1   | Server Action mutation   | 🟢   | WE   | solved createCard action + analog renameCard stub           |
| 2   | Forms + `useActionState` | 🟡   | TODO | a card form posting to an action with pending/error state   |
| 3   | Optimistic actions       | 🟡   | TODO | useOptimistic card move; revalidate on settle               |
| 4   | Secure actions           | 🟢   | EXT  | authorize actions via Auth.js session + zod-validate inputs |

## Done when

- [ ] `createCardAction` validates with zod, persists via `deps.repo`, calls
      `deps.revalidate("cards")`, and returns `{ ok, card }`; a zod-invalid input returns
      `{ ok: false, error }` and never touches the repo or the cache. The analog `renameCardAction`
      does the same for a rename.
- [ ] `<CardForm>` posts the typed title to the injected action, shows a disabled "Saving…"
      button while pending, an `alert` with the error after a failed action, and a `status` with
      the created title on success (progressive enhancement — the form works from `formAction`).
- [ ] `<CardBoard>` moves a card to the other column optimistically the instant it's clicked, then
      commits the authoritative list the action returns on settle — reconciling back if the server
      keeps the card put.
- [ ] `withAuth` returns `{ ok: false, error: "unauthorized" }` for a missing/under-privileged
      session and `{ ok: false, error }` for invalid input, calling the core action only when both
      the session and the zod-parsed input are valid.

> Worked-example (WE) tasks show a solved reference in `src/`; you complete the sibling stub.
> TODO tasks throw in `src/` — implement each. EXT mirrors the solution to read then extend.
> Tests import the reference from `solution/` — flip to `../src/...` to grade your own work.
