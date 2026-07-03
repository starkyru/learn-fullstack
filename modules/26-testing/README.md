# Module 26 — Testing (the trophy, end to end) 🟡

> **Depth lanes** 🟢 App · 🟡 Balanced · 🔴 Deep · **Task types** WE / TODO / FS / EXT

The trophy, top to bottom, in one module. You write a **unit** test TDD-first against a pure
reducer, a **component** test that runs a real React component while **MSW** intercepts its network,
an **integration** test that boots a Nest slice against a **real ephemeral Postgres**
(Testcontainers), and an **E2E** flow whose browser half ships as an artifact while its orchestration
logic is unit-tested against a fake driver. Then you write the note that tells you which tier to
reach for — and a **contract test** that catches the shape drift a mocked component test can't.

## Concepts

- **Pick the tier by what you're de-risking.** Pure logic → a fast unit test (Task 1). A component's
  render+fetch+paint path → a component test with the network mocked at the boundary, not the client
  (Task 2). The seams where modules meet the database → an integration test against a real Postgres
  (Task 3). A whole user journey → a thin layer of E2E (Task 4). "Write tests. Not too many. Mostly
  integration."
- **Mock only true boundaries.** MSW intercepts `fetch` at the HTTP layer, so the component under
  test runs unchanged — you never mock the unit itself. The integration test mocks _nothing_: it
  runs the real SQL against a throwaway container, which is why it catches a bad query or a wrong
  column mapping that a mocked repo would sail past.
- **Keep the irreducibly-manual stuff as artifacts, and unit-test the logic underneath it.** The
  Playwright spec + config and the Storybook play story are shipped for CI to run, but the gate
  doesn't launch a browser. The E2E scenario is expressed as ordered _data_ (`cardFlowSteps`) and a
  runner (`runFlow`) so its logic is covered headlessly against a fake driver.
- **A contract test guards a seam that unit tests mock apart.** The consumer states its expectation
  as a shared schema; the provider's response must satisfy it. Verify the real provider shape, and a
  drift fails loudly with the offending paths.

## Tasks

| #   | Task             | Lane | Type | What you build                                                           |
| --- | ---------------- | ---- | ---- | ------------------------------------------------------------------------ |
| 1   | Unit + TDD       | 🟢   | WE   | solved TDD'd moveCard reducer test + analog renameCard test stub         |
| 2   | Component + MSW  | 🟡   | TODO | an RTL test of the board with MSW-mocked API + a Storybook play test     |
| 3   | Integration      | 🟡   | TODO | Nest e2e against ephemeral Postgres (Testcontainers) in packages/testing |
| 4   | E2E              | 🟢   | TODO | Playwright: log in → create card → see it                                |
| 5   | When-to-use note | 🟢   | EXT  | the trophy note + a contract-test example                                |

## Done when

- [ ] `turbo test` runs the unit, component, and integration tiers together: the reducer transitions
      are exact and immutable, MSW intercepts the Board's `fetch` and the mocked cards render, and
      the Nest integration test spins a **real** Postgres and round-trips a card over supertest.
- [ ] The Board's "play" interaction (type a title, click **Add**) posts through MSW and the new
      card appears; the error path renders `role="alert"`.
- [ ] `cardFlowSteps` returns the exact ordered login→create→see steps and `runFlow` drives them
      against a fake driver (throwing when the final `expectText` fails) — no browser at gate time.
- [ ] `verifyProvider` accepts a conforming provider response and rejects a drifted one with the
      offending `path: message` issues.

> **WE** (Task 1): `moveCard` is solved in **both** `src/` and `solution/`; the analog `renameCard`
> throws `TODO` in `src/`. **TODO** (Tasks 2–4): `src/` throws — implement the body, keep the
> signature. **EXT** (Task 5): ships whole in `src/` — read it and extend it. Tests import from
> `solution/`; point them at `../src/...` to grade your own build.
>
> **Artifacts the gate does NOT run** (documented, not executed): `playwright.config.ts`,
> `e2e/card-flow.spec.ts`, and `stories/Board.stories.tsx`. They live outside `test/`, so vitest
> never collects them; the logic beneath them is unit-tested instead.
>
> **Task 3 needs a running Docker daemon** (Testcontainers pulls `postgres:16-alpine` once). Its
> `testTimeout` is 60 s to cover container startup.
