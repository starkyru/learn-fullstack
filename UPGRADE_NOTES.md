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

`pnpm-workspace.yaml` only (catalog + overrides); no source changes.

- **catalog** `postcss` `^8.4.49` → `^8.5.19`.
- **overrides** (exact-pinned, matching the existing supply-chain block):
  - `postcss: 8.5.19` — XSS (unescaped `</style>`). Next 15 pins a transitive `postcss@8.4.31`
    that the catalog can't reach, so an override is required. Prune when a Next release adopts
    `>=8.5.10`.
  - `qs: 6.15.3` — DoS (GHSA-q8mj-m7cp-5q26). Nest 10 `platform-express>body-parser@1.20.4`
    pulled `6.14.2` and declares `qs: ~6.14.0`, so 6.15.3 is out of body-parser's declared range —
    but no patched `6.14.x` exists (fix landed in 6.15.2), so 6.15.3 is the only viable pin, and the
    Nest 11 upgrade (T3) lands this same 6.15.x line **in** range. **The behavior change is intrinsic
    to the fix, not to the override**: the DoS was patched in 6.15.2 and qs's "combine duplicate keys
    into an array" change landed in 6.15.0, so _no patched qs exists without it_ — T3's in-range
    upgrade brings the identical behavior. Verified empirically under body-parser 1.20.4's **exact**
    extended options (`allowPrototypes:true, arrayLimit:max(100,paramCount), depth:32,
strictDepth:true, parameterLimit:1000`): all realistic **well-formed** query/body shapes
    (`a=1&b=2`, `arr[]=…`, `user[name]=…`, `obj[x][y]=…`, `filter[ids][]=…`, `text=hello+world`,
    `from=me&text=hi`, plain duplicate `text=hi&text=bye`) parse **byte-identically** 6.14.2↔6.15.3
    (0 diffs). Two classes of **conflicting/malformed** inputs differ: (a) malformed nested brackets
    (`text[b[c]]=x`), and (b) the _same key mixed as object **and** scalar_ (`text[x]=x&text=hello` →
    `{text:{x,hello:true}}` on 6.14.2 vs `{text:[{x},"hello"]}` on 6.15.3). Both are conflicting bodies
    a well-behaved client never sends; the affected sink (chat-api `POST /rooms/:id/messages`) defers
    input validation to teaching milestone M4 (see the pre-existing-finding note below). Baseline
    `pnpm why` already had Express on 6.15.3, so the override only moves the **Nest-10 body-parser**
    path. The Nest e2e tests that boot the full HTTP pipeline (`chat-api/test/chat.controller.test.ts`,
    `chat.gateway.test.ts`, `kanban-api/test/boards.e2e.test.ts`) pass. Prune after Nest 11 (T3).
  - `uuid: 11.1.1` — buffer-bounds (GHSA-w5hq-g745-h8pq). `@apollo/server@4` pulled `9.0.1` and
    declares `uuid: ^9`, so 11.1.1 is out of Apollo 4's declared range — verified kanban-api's
    Apollo tests pass (the `v4()` API is stable 9→11; both majors expose a CJS `node.require`
    export, so no ESM trap). Also bumps `dockerode`'s uuid (`^10`, dev/test-only, `v4()` only).
    Prune after Apollo 5 (T4), which ships a patched uuid natively.
  - `@hono/node-server: 1.19.13` — advisory. Prisma 7.8.0 is already latest and `@prisma/dev`
    pins `1.19.11`; no newer Prisma exists, so a pinned patch-up override is the only fix. Dev
    server only (`prisma dev`), not in app runtime.

Verified each vulnerable copy is gone (`pnpm why` → single patched version each). Gate: build ✓,
typecheck ✓ (68/68), lint ✓, test ✓ (68/68). Audit: **8 → 4 moderate** (remaining: file-type ×2 +
@nestjs/core → T3; @apollo/server → T4).

**Pre-existing finding surfaced during review (NOT introduced by T2, out of scope).** Codex flagged
that a malformed form-urlencoded body (`text[b[c]]=x`) could make `body.text` a non-string in
`chat-api`'s `POST /rooms/:id/messages`. This is a **pre-existing, qs-independent** input-validation
gap: `ChatController` uses `@Body() body: { text: string }` (a TS type erased at runtime) with no
`ValidationPipe`/DTO, so a JSON body `{"text":{…}}` already yields a non-string `text` today,
regardless of qs (and old qs 6.14.2 yields `undefined` for that malformed key — also a violation). It
is **not a regression the qs patch introduces**, and DTO validation for chat-api is a **deliberately
deferred teaching milestone** (`apps/chat-api/README.md` **M4** — "DTO validation (`class-validator` /
zod pipe)"); `class-validator` isn't even a chat-api dependency yet. Implementing it here would
front-run the curriculum and exceed the dependency-upgrade scope, so it is **flagged, not fixed**.

## T3 — Nest 10 → 11

_pending_

## T4 — GraphQL / Apollo

_pending_

## T5 — Closeout

_pending_
