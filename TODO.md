# Dependency-security upgrade plan

The production audit has no high or critical findings. Eight **moderate** advisories remain
across seven upstream dependency chains. Do this work in a dedicated, Docker-enabled upgrade
branch; these are compatibility upgrades, not lockfile-only fixes.

> **Status: DONE** on branch `team/dep-security/integration`. `pnpm audit --prod --audit-level
moderate` → **0 findings** (was 8 moderate). Full migration notes + evidence in
> [UPGRADE_NOTES.md](./UPGRADE_NOTES.md). Final versions at the bottom of this file.

## 1. Establish a baseline

- [x] Run `pnpm test`, `pnpm test:e2e`, `pnpm storybook:build`, and `pnpm audit --prod` with Docker available.
- [x] Record Node, pnpm, Postgres/Testcontainers, and browser versions in the upgrade PR. _(UPGRADE_NOTES.md → Baseline)_
- [x] Keep one commit per upgrade track so a regression can be bisected or reverted cleanly. _(T3+T4 merged into one commit — see note in §3.)_

## 2. Low-risk transitive patches

- [x] Update or safely override **PostCSS** to `>=8.5.10`. _(catalog `^8.5.19` + override `8.5.19` — Next 15 pins transitive 8.4.31.)_
- [x] Update or safely override **qs** to `>=6.15.2`. _(override during T2; **pruned in T5** — Express 5 now provides qs 6.15.3 in-range.)_
- [x] Update or safely override **uuid** to `>=11.1.1` after checking Apollo's supported range. _(override `11.1.1`; kept — `testcontainers>dockerode` still pulls uuid 10.0.0.)_
- [x] Update Prisma's development-server chain so **@hono/node-server** is `>=1.19.13`; prefer a supported Prisma release over a permanent override. _(Prisma 7.8.0 is already latest → pinned override `1.19.13` is the only fix.)_
- [x] After each patch, run the affected app/module tests and inspect `pnpm why <package>` to make sure the vulnerable copy is gone.

## 3. Nest 10 → Nest 11 track

- [x] Upgrade the shared Nest catalog entries together: `@nestjs/common`, `core`, `platform-express`, `testing`, `websockets`, and `platform-socket.io` to a compatible `11.1.18+` set. _(→ `11.1.28`.)_
- [x] Confirm the supported Node version and update the course setup requirements if Nest 11 changes them. _(Nest 11 peer: Node `>=20`; repo already requires `>=20` / CI 22·24 — no doc change needed.)_
- [x] Migrate and test the Chat API plus Modules 18, 21, 22, and 26. _(Nest 11 pulls Express 5; no source changes needed — Nest abstracts routing. Added a polling-transport e2e for chat-api.)_
- [x] Verify the upgrade removes the **@nestjs/core** advisory and brings **file-type** to `>=21.3.2` (both file-type advisories). _(file-type → single `21.3.4`.)_

> **Note:** Tracks 3 and 4 were committed as **one** commit, not two. `@nestjs/apollo@13`
> peer-requires `@apollo/server@^5`, and the shared `catalog:` couples the Nest-core and adapter
> versions, so Nest 11 forces graphql/apollo 13 + Apollo 5 for kanban-api in the same change — there
> is no green intermediate to split on. Documented in UPGRADE_NOTES.md.

## 4. GraphQL / Apollo track

- [x] Choose the Nest 11-compatible `@nestjs/graphql` / `@nestjs/apollo` release pair that supports Apollo Server `>=5.5.0`. _(→ `13.4.2` / `13.4.2`; `@apollo/server` `5.5.1`; `graphql` `^16.11`.)_
- [x] Upgrade `@apollo/server` and remove/replace the deprecated playground plugin if the new adapter requires it. _(kanban-api `app.module.ts`: `graphiql` dev-only replaces the deprecated graphql-playground the adapter mounts by default; added `@as-integrations/express5` required by the driver on Express 5.)_
- [x] Exercise Kanban GraphQL operations, subscriptions, generated client code, and Modules 20/20b. _(kanban-api e2e 5/5, mod-20 23/23, mod-20b 21/21; generated client + api-client unaffected.)_
- [x] Confirm the Apollo Server XS-search advisory is cleared without weakening CSRF protections. _(Apollo 5 CSRF prevention stays on by default; not disabled.)_

## 5. Close out

- [x] Run the full Docker-backed test suite, E2E, Storybook build, lint, typecheck, and `pnpm docs:sync`. _(all green: test 68/68, e2e 1/1, storybook ✓, lint ✓, typecheck 68/68, docs:sync OK.)_
- [x] Require `pnpm audit --prod --audit-level moderate` to return zero findings before merging. _(**0 findings**.)_
- [x] Update the lockfile, CI evidence, and this checklist with the final package versions and migration notes.

## Final package versions

| Package                                                                      | Before         | After                                   |
| ---------------------------------------------------------------------------- | -------------- | --------------------------------------- |
| postcss                                                                      | 8.4.49         | 8.5.19 (catalog + override)             |
| qs (transitive)                                                              | 6.14.2         | 6.15.3 (native via Express 5)           |
| uuid (transitive)                                                            | 9.0.1 / 10.0.0 | 11.1.1 (override)                       |
| @hono/node-server                                                            | 1.19.11        | 1.19.13 (override)                      |
| file-type (transitive)                                                       | 20.4.1         | 21.3.4 (native via Nest 11)             |
| @nestjs/{common,core,platform-express,testing,websockets,platform-socket.io} | 10.4.15        | 11.1.28                                 |
| @nestjs/graphql · @nestjs/apollo                                             | 12.2.1         | 13.4.2                                  |
| @apollo/server                                                               | 4.11.3         | 5.5.1                                   |
| graphql                                                                      | 16.10.x        | 16.14.2 (`^16.11`)                      |
| express (Nest apps)                                                          | 4.x            | 5.2.1                                   |
| @as-integrations/express5                                                    | —              | 1.1.2 (new; Apollo driver on Express 5) |

Verified: Node v25.7.0 (CI 22·24), pnpm 11.10.0, Docker 29.4.1, Postgres 16 (Testcontainers),
Playwright 1.61.1. Docker-absent runs still **skip** the Testcontainers suites (verified), so the
course remains runnable without Docker.
