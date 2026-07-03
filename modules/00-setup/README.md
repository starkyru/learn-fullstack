# Module 00 — Setup & Monorepo Tooling

> **Depth lanes** 🟢 App · 🟡 Balanced · 🔴 Deep · **Task types** WE / TODO / FS / EXT

Stand up the pnpm + Turborepo monorepo and the shared config so every later module has a
home. You are working _inside_ that monorepo right now — this module is about
understanding the machine you'll build on.

## Concepts

- **pnpm workspaces** — one lockfile, many packages; `workspace:*` links local packages;
  a **catalog** pins shared dependency versions once.
- **Turborepo** — a task pipeline (`turbo.json`) that runs `build`/`typecheck`/`test`
  across the graph, respects dependencies (`^build`), and caches results.
- **The shared spine** — `packages/*` (`config`, `ui`, `db`, `auth`, `api-client`,
  `testing`). Exercise code **imports from these**, never hardcodes a client.
- **Env as a contract** — `@learn-fullstack/config`'s `loadEnv()` parses `process.env`
  once with zod and fails fast, so a misconfigured deploy dies at boot.

## Tasks

| #   | Task                | Lane | Type | What you build                                                                  |
| --- | ------------------- | ---- | ---- | ------------------------------------------------------------------------------- |
| 1   | Tour the pipeline   | 🟢   | TODO | run `pnpm typecheck && pnpm test`; read `turbo.json`; explain `^build`          |
| 2   | Validate env config | 🟢   | WE   | `readAppConfig()` is solved; write the analog `requireEnv()` in `src/01-env.ts` |
| 3   | Compose up Postgres | 🟢   | TODO | `pnpm db:up && pnpm db:migrate && pnpm db:seed`; confirm the row exists         |

> Worked-example tasks show a solved reference in `src/`; you complete the sibling stub.
> Tests import the reference from `solution/` — flip the import to `../src/...` to check
> your own work. Progress is tracked by `/progress`.

## Done when

- [ ] `pnpm typecheck && pnpm test` is green across the workspace.
- [ ] `requireEnv()` returns the value for a set key and throws a helpful error for a
      missing one.
- [ ] `pnpm db:up && pnpm db:migrate && pnpm db:seed` succeeds and seeds the learner row.
