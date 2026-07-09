# AGENTS.md — context for any agent working in `learn-fullstack`

This file is the **canonical, agent-agnostic** context for this repo. Any coding agent
(Cursor, Codex, GitHub Copilot, Claude Code, …) auto-loads it — read it first, then help
the learner well. `CLAUDE.md` is a thin pointer back to this file; don't duplicate
guidance there.

## What this is

`learn-fullstack` is a **personal, hands-on full-stack TypeScript course** — a
project-based curriculum that takes one person from TypeScript basics to shipping two
real apps: a **Kanban board** (Trello-lite) and a **realtime chat** (Slack-lite). It
covers React (all hooks), Next.js, Node/NestJS, REST **and** GraphQL, Postgres raw
**and** via Prisma, CSS/Tailwind, auth, realtime, testing, and deploy. The reader is the
**learner**; you are their tutor / pair-programmer. **Favor teaching over just shipping
code** (see `/tutor`).

## Repo layout

```text
learn-fullstack/
├── apps/                  # the two capstones (deployables)
│   ├── kanban-web/  kanban-api/    # Next.js + Nest GraphQL, Auth.js, TanStack Query, Tailwind
│   └── chat-web/    chat-api/      # Vite SPA + Nest REST/WS, JWT/Passport, RTK, CSS Modules
├── packages/              # the shared spine — exercises import from these
│   ├── tsconfig/  eslint-config/  config/  shared/
│   ├── ui/        # the Storybook-documented sample component library (Tailwind preset)
│   ├── db/        # Prisma client + schema + migrations + seed (exports `db`)
│   ├── auth/      # scrypt password hashing (Phase 0 — module 21 builds JWT/sessions/CSRF and compares)
│   ├── api-client/# typed REST + codegen GraphQL client, useSocket(), MSW handlers
│   └── testing/   # RTL render, MSW server, Testcontainers Postgres, factories
├── modules/               # THE LESSONS — each: README.md (the lesson) + src/ + solution/ (gated)
├── docs/                  # CAPSTONES + RESPONSIVE, THEMING, STYLING, REACT_PERFORMANCE, AUTH_COMPARISON, TESTING, REALTIME, GLOSSARY
├── scripts/               # smoke.ts, docs-sync.ts, progress.ts, …
├── AGENTS.md  CLAUDE.md  README.md  CURRICULUM.md  PROGRESS.md
└── turbo.json  pnpm-workspace.yaml  package.json  docker-compose.yml
```

**Each module's `README.md` is the source of truth** for what that lesson teaches — read
it before tutoring, reviewing, or quizzing. If a module README is missing or incomplete,
fall back to `README.md` / `CURRICULUM.md` and say so rather than inventing content.

## The module map (00–29 + companions)

00 Setup · 01 TypeScript · 02 Modern JS · 03 HTTP · 04 Node · 05 React Core · **05b CSS &
Layout** · **05c CSS & React Animations** · **05d Responsive Design** · 06 Hooks I · 07 Hooks II · **07b Hand-rolled
hooks 🔴** · 08 Patterns/Perf · **08b Advanced patterns** · 09 Forms · 10
Concurrent/Suspense/React 19 · **10b 3D: Three.js & react-three-fiber** · 11 Component
Library + Storybook + Tailwind · **11b Accessibility & WCAG** · 12 Redux Toolkit · 13
Zustand · **13b Mini store 🔴** ·
14 TanStack Query · **14b Mini query client 🔴** · 15 SQL/Postgres raw · 16 Prisma · 17
Express · 18 NestJS · 19 REST design · 20 GraphQL E2E · **20b DataLoader 🔴** · 21 Auth &
Security · **21b Session auth 🔴** · 22 Realtime WebSockets E2E · **22b Webhook delivery 🔴** · 23 Next.js Core · **23b
Mini router 🔴** · 24 Next.js Data/SEO · **24b Next advanced** · 25 Server Actions · 26
Testing · 27 Ops/Docker/CI/CD · 28 Perf/Observability/Debugging · **28b Debugging &
Profiling** · **28c Microfrontends 🔴** · 29 Capstone Integration. Full detail: `CURRICULUM.md`.

## Depth-level convention (🟢 / 🟡 / 🔴)

The learner picks a lane per module; each task in the README table is tagged.

- 🟢 **App** — build it with the ecosystem/libraries.
- 🟡 **Balanced** — build the app **and** hand-implement one core piece for intuition.
- 🔴 **Deep** — implement the machinery **from scratch**; 🔴 tasks **forbid the obvious
  library** — that constraint is the point. **Never suggest a banned library for a 🔴
  task.** Per-topic forbidden libs: state → Redux/Zustand · query → TanStack Query · auth
  → Auth.js/Lucia/Passport · realtime → socket.io-client · GraphQL N+1 → dataloader ·
  router → any router lib · styling (05b) → Tailwind/UI kit · animation (05c FLIP) → Framer
  Motion/any animation lib.

Respect the learner's chosen lane when advising or reviewing.

## Compare, don't crown

Auth, testing, state, realtime, GraphQL, and APIs each teach **multiple approaches** — the
two capstones deliberately use **different auth stacks** (Kanban = Auth.js/session/OAuth;
Chat = JWT/Passport). Surface the _tradeoffs between approaches_, don't declare one winner.
Route auth questions to `docs/AUTH_COMPARISON.html`, testing to `docs/TESTING.html`, realtime
to `docs/REALTIME.html`, styling to `docs/STYLING.html`.

## The shared packages (where the spine binds)

The spine binds at two levels — don't mix them up when advising:

- **Apps (`apps/*`) bind the real primitives.** DB → `import { db } from
"@learn-fullstack/db"` (never `new PrismaClient()` inline) · components →
  `@learn-fullstack/ui` · API calls → `@learn-fullstack/api-client` · password hashing →
  `@learn-fullstack/auth` · tests → `withEphemeralPostgres()` + MSW from
  `@learn-fullstack/testing`. Real-DB/auth wiring lands at the apps' composition roots
  (milestone M1+ — the swap points are marked in `apps/kanban-*`/`chat-*` source).
- **Exercise modules (`modules/*`) are deliberately self-contained.** Every stateful or
  effectful collaborator (repo, clock, id source, session, transport) is an **injected
  in-memory fake**, so the test gate stays fast, deterministic, and Docker-free — and
  building or faking that primitive is usually the lesson itself: raw SQL (15) · own
  throwaway SQLite Prisma schema (16) · injected in-memory repos (17–19) · no-DB GraphQL
  with a countable batch boundary (20) · hand-rolled auth primitives (21, 21b) · native
  socket (22) · HMAC webhooks (22b) · Next.js logic behind injected fakes because the
  runtime isn't unit-testable (23–25) · zero-dep observability/profiling (28, 28b) ·
  from-scratch runtimes (🔴 companions) · repo-shaped DI boundaries the capstone later
  binds for real (29). **Don't retrofit `db`/`auth` into a module** — that inverts the
  dependency-injection lesson.
- Every tsconfig/eslint/tailwind still `extends` `@learn-fullstack/config`, and modules
  use `@learn-fullstack/tsconfig`/`shared` where useful.

## Keep docs in sync — HARD RULE

**Whenever you add, remove, or change a lesson (a module, a companion, or a task), update
ALL of these in the same change:**

1. the module's own `README.md` (concepts + task table + "Done when");
2. the root **`README.md`** module table (+ a companion callout if it's a `NNx` deep-dive);
3. **`CURRICULUM.md`** (the module's section: title, objective, task table, "Done when");
4. **`PROGRESS.md`** (add/rename the module's row);
5. **`docs/CAPSTONES.html`** if a capstone's data model / API surface / milestones changed.

Never leave a lesson that exists on disk but is missing or stale in these files. A CI
`docs-sync` check (`scripts/docs-sync.ts`) fails the build if a `modules/NN-*` folder has
no matching entry in `README.md` **and** `CURRICULUM.md`. When in doubt, run
`tsx scripts/docs-sync.ts` before you finish. The `scaffold-module` skill does all of this
automatically — prefer it for new modules.

## How to run things

```bash
pnpm install                          # + Husky hooks
pnpm build                            # build the shared packages/* ONCE (see note)
pnpm db:up && pnpm db:migrate && pnpm db:seed
pnpm dev                              # turbo runs app dev servers
pnpm --filter ./apps/kanban-web dev   # one app
pnpm --filter @learn-fullstack/ui storybook
tsx modules/<id>/src/<file>.ts        # run one exercise
pnpm turbo run typecheck test --filter=./modules/<id>...   # preferred: builds deps first
pnpm test:e2e                         # Playwright (needs Docker)
```

**Prefer the `turbo run … --filter=./modules/<id>...` forms** — they build the shared
`@learn-fullstack/*` packages first. A bare `pnpm --filter ./modules/<id> test` on a fresh
clone (before any `pnpm build`/`pnpm dev`) fails to resolve the workspace packages because
their `dist/` doesn't exist yet — run `pnpm build` once after install to avoid this.

Slow modules (Nest e2e via Testcontainers, Playwright) need Docker running.

## Interactive learning tools

- **`/tutor [module# or topic] <question>`** — patient tutor: reads the module README,
  answers (Socratic for concepts, concrete for "how do I proceed"), offers to review the
  learner's files. `.claude/commands/tutor.md`.
- **`/exam [module# or topic]`** — a 5-question knowledge check, one at a time, graded,
  with a final score + study tips. `.claude/commands/exam.md`.
- **`/progress [module# or range]`** — runs typecheck/tests per module, greps for
  unfinished stubs, reconciles against `PROGRESS.md`, reports % + next task + weak areas.
  `.claude/skills/check-progress/SKILL.md`.

## Course-maintenance skills

- **`jd-gap-analysis`** — given a job description, extract the full-stack requirements, map
  them against `CURRICULUM.md`, report ranked gaps + house-style module suggestions.
- **`learning-plan`** — evaluate the learner's current knowledge (interview + `PROGRESS.md`/
  stub signals, optional JD via `jd-gap-analysis`) and write a personalized, prereq-ordered
  study path to `PERSONAL_LEARN_PLAN.md` (per-module skip/skim/do/deep + lane). Advisory;
  `PROGRESS.md` stays canonical.
- **`scaffold-module`** — generate a new module/companion in exact house style (README +
  `src/` stubs + tests) and wire it into all the docs above (satisfies the keep-in-sync rule).

## Writing exercise scaffolds

Task-type taxonomy (label every task in the README table with a lane 🟢/🟡/🔴 **and** a
type): **(a) worked-example + analog** — a _fully-implemented_ reference fn/component next
to a sibling **stub the learner completes by analogy** (encouraged; the reference is shown
in full by design); **(b) cold TODO stub** — hint-only (type/shape/which-functions/steps),
no solution; **(c) from-scratch 🔴** — forbid the obvious library; **(d) extend/refactor**.

For (b)/(c) the core function is a stub that **throws** (`throw new Error("TODO: …")`); the
docstring **hints, not hands over** — keep the TYPE/signature, return SHAPE, which
functions to call, which params matter, and the numbered steps; remove assembled literals,
the exact chain, and the final `return`. Only edit comments on **unimplemented** stubs.

**Test rules:** tests import and exercise the **real** exported code (never re-implement the
logic under test); expected values are hand-written / independently derived; assertions are
discriminating (assert exact output/shape); mock only true external boundaries (network,
fs, clock, DB, browser) — e.g. MSW for network, `withEphemeralPostgres()` for the DB.

**Definition of Done for a module** — a module is complete when:

1. `README.md` has **concepts** (+ a diagram where it helps), a **task table** where every
   row carries a lane (🟢/🟡/🔴) **and** a type (WE/TODO/FS/EXT), and a **"Done when"** list.
2. Exercise **stubs under `src/` typecheck and run** (throw `TODO` at the core), with
   hint-not-handover docstrings; worked-example references shown in full next to their analogs.
3. A **gated reference solution** (`modules/NN/solution/`, off the learner's default path)
   that **passes the module's tests** — this is what CI runs to prove solvability.
4. Module boundaries follow the **self-containment rule** (see "The shared packages"):
   stateful/effectful collaborators are injected in-memory fakes; the real spine
   `db`/`auth` bind only in `apps/*`. Config/tsconfig still extend `@learn-fullstack/*`.
5. Wired into **both** `README.md` and `CURRICULUM.md`; a `PROGRESS.md` row added.
6. `turbo run typecheck test --filter=./modules/NN-*` **green**; any Storybook stories build
   and their play tests pass.

## When you help

- Be a **tutor first**: prefer hints, structure, and the next concrete step over dumping a
  full solution — unless the learner explicitly asks for it.
- Anchor answers to the module `README.md`, not to your own memory of how a tool behaves.
- Keep exercise code importing the shared `@learn-fullstack/*` packages.
- Obey the **keep-docs-in-sync HARD RULE** above on every lesson change.
