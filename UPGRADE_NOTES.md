# Dependency-security upgrade — migration notes

Record of the dependency-security upgrade — one commit per track so any regression can be bisected or
reverted cleanly. Becomes the upgrade PR body.

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

## T3 + T4 — Nest 10 → 11 and Apollo 4 → 5 (one atomic wave)

**Why merged:** `@nestjs/apollo@13` peer-requires `@apollo/server@^5` and `@nestjs/graphql@13`
requires `@nestjs/core/common @^11` + `graphql @^16.11`. The `catalog:` is shared, so bumping Nest
core to 11 forces kanban-api's graphql/apollo to 13 + Apollo Server to 5 in the same change — there is
no green intermediate. Kept as one commit rather than TODO's two-track split (documented deviation).

**Catalog bumps** (`pnpm-workspace.yaml`): `@nestjs/common`, `core`, `platform-express`, `testing`,
`websockets`, `platform-socket.io` `^10.4.15` → `^11.1.28`; `@nestjs/graphql`, `@nestjs/apollo`
`^12.2.1` → `^13.4.2`; `@apollo/server` `^4.11.3` → `^5.5.1`; `graphql` `^16.10.0` → `^16.11.0`
(resolves 16.14.2). `reflect-metadata`/`rxjs`/`graphql-subscriptions`/`graphql-request` unchanged.

**New dependency:** `@as-integrations/express5` (catalog `^1.1.2`; added to `apps/kanban-api` +
`modules/20-graphql-e2e`). `@nestjs/apollo@13`'s `ApolloDriver` `loadPackage()`s it at runtime for the
Express platform under Apollo Server 5; without it kanban-api's e2e aborts (`process.exit(1)`). Peers
(`express ^5`, `@apollo/server ^4||^5`) satisfied.

**Source changes: one, kanban-api only.** Express 5 (`@nestjs/platform-express@11` pulls
`express@5.2.1`) needed no code edits — grep found no wildcard routes, `req.query` mutation, or removed
Express APIs in either app, and the Nest e2e suites (which boot the real Express-5 pipeline) pass.
Apollo 5 CSRF stays on by default; `ts-morph`/`@apollo/subgraph` peers were not required (`autoSchemaFile`
builds the schema in memory). The **one** edit fulfils TODO T4's "remove/replace the deprecated
playground plugin": `@nestjs/apollo` mounts the deprecated `ApolloServerPluginLandingPageGraphQLPlayground`
by default (a live boot confirmed `GET /graphql` served the old playground, loading
`graphql-playground-react` from jsdelivr). `apps/kanban-api/src/app.module.ts` now sets
`graphiql: process.env.NODE_ENV !== "production"`, which serves the maintained GraphiQL explorer in dev
and disables the landing page in production (verified at runtime: `GET /graphql` returns GraphiQL, not
the playground; `POST /graphql` still answers queries). This does not front-run any kanban-api
milestone (M1–M6 cover persistence/auth/DataLoader/subscription/validation, not the explorer).

**Advisories cleared:** `@nestjs/core` (GHSA-36xv-jgw5-4q75) + **both** `file-type` advisories
(`file-type` now single `21.3.4 ≥ 21.3.2` in the prod tree) + the `@apollo/server` XS-search
(→ 5.5.1). `pnpm audit --prod --audit-level moderate` → **0 known vulnerabilities** (4 → 0). Express 5
also lands qs `6.15.x` natively (in range) — the T2 `qs` override is now redundant (prune in T5).

**Gate:** build 11/11 ✓, typecheck 68/68 ✓, lint ✓, test **68/68** ✓ (independently re-run; Docker
Testcontainers ran for real — mod-26 integration, mod-15 SQL). App e2e through the real Nest/Express-5
HTTP pipeline: chat-api 8/8, kanban-api (Apollo 5) 5/5.

**Known residual (non-blocking, upstream):** `@nestjs/apollo@13.4.2` hard-`require()`s the deprecated
`@apollo/server-plugin-landing-page-graphql-playground@4.0.1` at the top of its driver, which peer-wants
`@apollo/server ^4` → one `unmet peer` warning (we ship 5.5.1). With `graphiql` set (above) the plugin
is never instantiated/served, but it stays _installed_ because it's a hard dep of `@nestjs/apollo` — it
pulls no second `@apollo/server` (peer only) and audit is 0, so it's cosmetic upstream noise, not a
re-introduced advisory. Not overridden (there's no non-deprecated drop-in and an override risks the
driver's `require`). Flagged for visibility.

**Store hygiene (for T5):** this tree came from an incremental `pnpm install`, so `node_modules/.pnpm`
still holds the unreferenced pre-migration packages (`@apollo/server@4`, `@nestjs/*@10`). They're
unreachable via the lockfile (no runtime/audit risk) but T5 should confirm a clean
`pnpm install --frozen-lockfile` before CI caches/images bake the tree.

**Codex seal outcome.** Codex raised two coverage/hardening points on the migration:

1. _Socket.IO tests forced `transports:["websocket"]`, skipping the HTTP long-poll path._ **Fixed:**
   added `apps/chat-api/test/chat.gateway.transport.test.ts`. A follow-up Codex round correctly noted a
   default-transport test asserting the upgrade is racy (localhost upgrades before Socket.IO's `connect`
   fires) and that Engine.IO bypasses Express middleware — so the test now **pins `transports:["polling"]`**,
   asserts the session actually runs on `polling` (`engine.transport.name === "polling"`), and ACKs a
   `join` over long-poll. Deterministic, honestly scoped to the Socket.IO/Engine.IO transport (Express 5
   REST middleware is covered by `chat.controller.test.ts`). Green (chat-api 9/9).
2. _`graphiql: NODE_ENV !== "production"` fails open on nonstandard/unset `NODE_ENV`._ **Reasoned
   rebuttal:** this mirrors `@nestjs/apollo`'s **own** landing-page gate (its driver uses the identical
   `process.env.NODE_ENV === "production"` check), so the migration introduces no new prod exposure vs.
   the framework default — and `=== "development"` would break the common unset-`NODE_ENV` local-dev
   case for learners. Fail-closed config validation + explicit `introspection`/rate-limiting is
   kanban-api's **deferred M6 milestone** ("input validation, error mapping, rate limiting"), out of the
   dependency-upgrade scope. Flagged, not fixed.

## T5 — Closeout

**Override pruning** (`pnpm-workspace.yaml`): removed the `qs` override — Express 5's bundled
body-parser now resolves `qs@6.15.3` in-range with no override (verified `pnpm why qs --prod` →
single 6.15.3). **Kept** `uuid: 11.1.1`: removing it drops the prod tree to `uuid@10.0.0` via
`@learn-fullstack/testing > @testcontainers/postgresql > testcontainers > dockerode` (a prod dep of
the testing package) and `pnpm audit --prod` goes back to 1 moderate — so the T2 "prune after Apollo 5"
note was incomplete; the override is still doing real work on that chain (comment corrected). Kept
`postcss` (Next 15 transitive) and `@hono/node-server` (Prisma dev) — their parents are unchanged.

**Full closeout gate (all green):** `build` ✓, `typecheck` ✓ (68/68), `lint` ✓, `test` ✓ (68/68,
Docker-backed Testcontainers ran for real), `test:e2e` ✓ (Playwright board a11y 1/1), `storybook:build`
✓, `docs:sync` ✓. `pnpm install --frozen-lockfile` → clean (lockfile consistent, no drift).

**`pnpm audit --prod --audit-level moderate` → 0 findings** (8 → 0 across the run).

**Docker-absent still skips (verified):** with `CI` unset and an invalid `DOCKER_HOST`, `hasDocker()`
returns false and the container-backed suites `describe.skipIf(!hasDocker())` **skip** rather than fail
— e.g. `@learn-fullstack/testing` = 3 passed / 1 skipped, `mod-15-sql-postgres` = 6 passed / 18
skipped, both exit 0. The course remains runnable without Docker.

**Store hygiene:** the incremental installs left pre-migration packages in `node_modules/.pnpm`; they're
unreferenced by the lockfile (frozen install is clean), so CI/images built from `--frozen-lockfile`
resolve only the new tree. A `pnpm store prune` locally is optional cleanup, not required for
correctness.

### Final package versions

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

### Holistic (aggregate) review dispositions

The final cross-cutting Codex pass raised three points on the combined diff; each is accepted with
reason (none block a green, 0-advisory upgrade):

1. **GraphiQL/introspection gate is `NODE_ENV !== "production"` (fail-open on unset/staging).** Held as
   rebutted (see the T3+T4 Codex-seal note): it mirrors `@nestjs/apollo`'s **own** landing-page gate and
   Apollo Server 5's own introspection default, so it introduces no exposure beyond the framework
   default; `=== "development"` would break the common unset-`NODE_ENV` local-dev case. Fail-closed env
   validation + explicit `introspection` + rate limiting is kanban-api's **deferred M6 milestone** and a
   separate hardening effort, out of a dependency-security upgrade's scope. kanban-api is the M0 slice
   (`main.ts`: "NOT gated … no running server at gate time").
2. **The shared `express`/`@types/express` catalog stays at v4** — **by design, not an incomplete
   migration.** Those catalog entries are consumed only by `modules/17-express` and
   `modules/19-rest-api-design`, which **teach Express 4**; only Nest's transitive `platform-express`
   moved to Express 5 (for the apps). The two majors serve disjoint consumers — no package resolves
   both — so there is no runtime split to fix. Migrating the Express lessons to v5 is a curriculum
   change, out of scope.
3. **`@apollo/server-plugin-landing-page-graphql-playground@4.0.1` remains in the graph.** It is a hard
   dependency `require()`d **unconditionally** at the top of `@nestjs/apollo@13.4.2`'s
   `apollo-base.driver.js` (line 6, before any config), so it cannot be removed via a pnpm override
   without breaking `require("@nestjs/apollo")`. With `graphiql` set it is never instantiated, it pulls
   no second `@apollo/server` (peer only), and `audit --prod` is 0. 13.4.2 is the latest `@nestjs/apollo`;
   this resolves upstream when a release drops the dep. Accepted upstream residual.

## Follow-up hardening (post-merge request)

Three of the above were subsequently **fixed** on request (branch `deps/hardening-followups`):

1. **chat-api body validation (was the pre-existing / deferred-M4 finding).**
   `apps/chat-api/src/chat.controller.ts` now validates at the boundary: `POST /rooms/:id/messages`
   throws `BadRequestException("`text` must be a non-empty string")` when `text` isn't a non-empty
   string, so a JSON object or mixed form-urlencoded key can no longer be persisted as a non-string
   `Message.text`. It also caps length at `MAX_MESSAGE_LENGTH = 4000` (a follow-up Codex round flagged
   that an authed client could otherwise store unbounded large strings in the in-memory map — a memory
   DoS). Deliberately a **minimal boundary check, not class-validator** — chat-api's M4 lesson (the
   DTO/`ValidationPipe` approach) stays intact; `class-validator` is still not a dependency. Tests added
   (`chat.controller.test.ts`): object `text` → 400 (nothing persisted), missing/blank → 400, `>4000`
   chars → 400 while exactly 4000 → 201. chat-api 12/12. _(Rate limiting + bounded retention remain the
   deferred M-milestones; the `ChatGateway` `message` handler shares the untrusted-payload shape but is
   scoped to its M3 auth/sender-verification milestone — left as is.)_

2. **kanban-api graphiql/introspection gate is now default-deny + explicit.**
   Two Codex rounds sharpened this. The policy is a **pure function**, `graphqlDevToolsEnabled(nodeEnv)`
   in `apps/kanban-api/src/graphql-devtools.ts`: it returns true **only** for an explicit `"development"`
   or `"test"` env — `production`, `staging`, `prod`, uppercase, whitespace, **and unset/empty all fail
   closed** (round 2 flagged that treating unset as dev is fail-open for a deployment that forgets to set
   `NODE_ENV`). `app.module.ts` drives **both** `graphiql` and `introspection` from it **and sets
   `playground: false`** — required, because round 1 caught that with `playground` left undefined
   `@nestjs/apollo` mounts its deprecated graphql-playground fallback for any non-`production` NODE_ENV
   even when `graphiql` is false. To keep local DX, `kanban-api`'s `dev` script now sets
   `NODE_ENV=development` (via `cross-env`, added). Covered by a deterministic unit test
   (`graphql-devtools.test.ts`: development/test → true; production/staging/prod/uppercase/whitespace/
   empty/undefined → false) and runtime-verified across unset/development/staging/production (explorer +
   introspection only under development/test; disabled everywhere else — no GraphiQL, no deprecated
   playground).

3. **Deprecated playground plugin peer mismatch formalized.**
   The plugin can't be removed (hard `require`, above), so `pnpm-workspace.yaml` adds a
   `peerDependencyRules.allowedVersions` entry accepting `@apollo/server 5` for it — the unmet-peer
   warning is gone and the intentional, inert mismatch is documented in one place. Remove when
   `@nestjs/apollo` drops the dependency upstream.

**Not changed — disposition #2 (`express ^4` catalog) stands:** it is not a defect. Those catalog
entries deliberately keep `modules/17-express` / `modules/19-rest-api-design` on Express 4 (the version
they teach); only the Nest apps run Express 5 (transitively), and no package resolves both majors.
Migrating the lessons to Express 5 is a curriculum rewrite, not a security fix — out of scope here; can
be a separate task if wanted.

**Gate after the follow-ups:** build ✓, typecheck ✓ (68/68), lint ✓, test ✓ (68/68), `audit --prod` = 0.
