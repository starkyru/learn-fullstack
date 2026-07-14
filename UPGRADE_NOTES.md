# Dependency-security upgrade — migration notes

Tracks the work in `TODO.md` (dependency-security upgrade plan). One commit per track so any
regression can be bisected or reverted cleanly. Becomes the upgrade PR body.

## Baseline (T1)

Captured on branch `team/dep-security/integration`, off `main` @ `17c5aa9`.

| Tool                                       | Version                  |
| ------------------------------------------ | ------------------------ |
| Node                                       | v25.7.0 (CI: 22/24)      |
| pnpm                                       | 11.10.0                  |
| Docker                                     | 29.4.1                   |
| Postgres (Testcontainers + docker-compose) | postgres:16              |
| testcontainers                             | 10.28.0                  |
| Playwright                                 | 1.61.1                   |
| Next.js                                    | 15.x (catalog `^15.1.3`) |

Baseline gate: `build` ✓, `typecheck` ✓ (68/68), `lint` ✓, `test` ✓ (68/68, Docker up so
Testcontainers ran for real).

**Pre-existing fix (not a dependency change), required to unblock the test gate:**
`apps/kanban-web/vitest.config.ts` had no `include`/`exclude`, so Vitest's default glob
collected the Playwright spec `e2e/board.spec.ts` and threw _"test() not expected here"_ —
i.e. `pnpm test` (which CI runs) was red on `main`. Excluded `e2e/**` from Vitest; Playwright
specs still run via `pnpm test:e2e`. This is out of the dependency-upgrade scope but the
closeout gate (T5) requires a green full suite.

Open advisories at baseline (8 moderate, from `pnpm audit --prod --audit-level moderate`):

| Advisory                | Package                                   | Fixed by track   |
| ----------------------- | ----------------------------------------- | ---------------- |
| GHSA-36xv-jgw5-4q75     | @nestjs/core (via chat-api Nest 10 chain) | T3               |
| file-type advisory ×2   | file-type 20.4.1 (via @nestjs/common 10)  | T3               |
| qs DoS                  | qs 6.14.2 (via Nest 10 platform-express)  | T2 override / T3 |
| uuid buffer bounds      | uuid 9.0.1 (via @apollo/server 4)         | T2 override / T4 |
| postcss                 | postcss 8.4.49                            | T2               |
| @hono/node-server       | 1.19.11 (via @prisma/dev > prisma 7.8.0)  | T2 override      |
| Apollo Server XS-search | @apollo/server 4.11.x                     | T4               |

## T2 — Low-risk transitive patches

_pending_

## T3 — Nest 10 → 11

_pending_

## T4 — GraphQL / Apollo

_pending_

## T5 — Closeout

_pending_
