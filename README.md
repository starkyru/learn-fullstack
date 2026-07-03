# learn-fullstack

> A personal, hands-on, project-based course that takes one person from **TypeScript
> basics to shipping two production apps** — a **Kanban board** (Trello-lite) and a
> **realtime chat** (Slack-lite). TypeScript end-to-end: React, Next.js, Node/NestJS,
> REST **and** GraphQL, Postgres raw **and** via Prisma, auth, realtime, testing, and
> deploy. Modeled on the house style of [`learn-ai`](https://github.com/starkyru/learn-ai).

Each module's `README.md` **is** the lesson: concepts → a numbered task table → a
"Done when" checklist. Exercises are code you run, break, and extend. A set of shared
workspace packages (`@learn-fullstack/*`) is the spine every exercise imports from.

- 🗂️ **Detailed curriculum:** [`CURRICULUM.md`](./CURRICULUM.md)
- 🅰🅱 **Capstone specs:** [`docs/CAPSTONES.md`](./docs/CAPSTONES.md) (data models, API surface, milestones)
- 🤖 **Agent context:** [`AGENTS.md`](./AGENTS.md) (canonical, agent-agnostic)
- ✅ **Your progress:** [`PROGRESS.md`](./PROGRESS.md)

## How it works

- **Depth lanes** — pick one per module (or do all three):
  - 🟢 **App** — build it with the ecosystem.
  - 🟡 **Balanced** — build it **and** hand-implement one core piece.
  - 🔴 **Deep** — build the machinery from scratch (the obvious library is _forbidden_ —
    that constraint is the point).
- **Task types** — `WE` worked-example+analog · `TODO` cold hint-only stub · `FS`
  from-scratch 🔴 · `EXT` extend/refactor.
- **Shared spine** — exercises import from `@learn-fullstack/{config,ui,db,auth,
api-client,testing}` instead of hardcoding.

## Interactive tools (slash commands & skills)

| Tool                                   | What it does                                                                                                                                               |
| -------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/tutor [module# or topic] <question>` | Patient tutor — **learn a topic**: reads the module README, answers (Socratic for concepts, concrete for "how do I proceed"), offers to review your files. |
| `/exam [module# or topic]`             | **Knowledge check** — a 5-question quiz, one at a time, graded, with a score + study tips.                                                                 |
| `/progress [module# or range]`         | Runs typecheck/tests per module, greps for unfinished stubs, reconciles against `PROGRESS.md`, reports % complete + next task + weak areas.                |
| `jd-gap-analysis <JD text/URL>`        | Maps a job description against the curriculum, reports ranked gaps.                                                                                        |
| `learning-plan [goal / JD]`            | Evaluates what you already know, writes a personalized prereq-ordered module plan to `PERSONAL_LEARN_PLAN.md`.                                             |
| `scaffold-module <id-slug> "<title>"`  | Generates a new module in house style (README + stubs + tests), wired into the docs.                                                                       |

## The module map

30 numbered modules (00–29) + 14 lettered companion deep-dives. Full detail in
[`CURRICULUM.md`](./CURRICULUM.md).

| #       | Module                                            | #       | Module                                              |
| ------- | ------------------------------------------------- | ------- | --------------------------------------------------- |
| 00      | Setup & Monorepo Tooling                          | 15      | SQL & Postgres (raw)                                |
| 01      | TypeScript for Full-Stack                         | 16      | Prisma & `packages/db`                              |
| 02      | Modern JavaScript & Async                         | 17      | Node HTTP & Express                                 |
| 03      | HTTP & the Web Platform                           | 18      | NestJS Fundamentals                                 |
| 04      | Node.js Fundamentals                              | 19      | REST API Design                                     |
| 05      | React Core                                        | 20      | GraphQL End-to-End · **20b** DataLoader 🔴          |
| **05b** | CSS & Modern Layout                               | 21      | Authentication & Security · **21b** Session auth 🔴 |
| **05c** | CSS & React Animations                            |         |                                                     |
| 06      | React Hooks I                                     | 22      | Realtime: WebSockets End-to-End                     |
| 07      | React Hooks II · **07b** Hand-rolled hooks 🔴     | 23      | Next.js Core (App Router) · **23b** Mini router 🔴  |
| 08      | React Patterns & Perf · **08b** Advanced patterns | 24      | Next.js Data & SEO · **24b** Next advanced          |
| 09      | Forms                                             | 25      | Server Actions & Full-Stack Next                    |
| 10      | Concurrent React, Suspense & React 19             | 26      | Testing (the trophy)                                |
| **10b** | 3D: Three.js & react-three-fiber                  |         |                                                     |
| 11      | Component Library · **11b** Accessibility & WCAG  | 27      | Ops: Docker, CI/CD & Deploy                         |
| 12      | State: Redux Toolkit                              | 28      | Performance, Observability & Debugging              |
| 13      | State: Zustand · **13b** Mini store 🔴            | **28b** | Debugging & Profiling                               |
| 14      | TanStack Query · **14b** Mini query client 🔴     | **28c** | Microfrontends: Module Federation 🔴                |
|         |                                                   | 29      | Capstone Integration                                |

**Companions:** 05b, 05c, 07b, 08b, 10b, 11b, 13b, 14b, 20b, 21b, 23b, 24b, 28b, 28c (deep-dives;
optional, don't block the main path).

## How to learn

The loop is: **read the module README → work in `src/` → grade yourself against the tests →
commit → move on.** Each module's `README.md` _is_ the lesson.

### Setup (once)

```bash
git clone <this-repo> && cd learn-fullstack
pnpm install                 # also registers the Husky pre-commit hooks
cp .env.example .env         # fill DATABASE_URL, AUTH_SECRET, JWT_SECRET, OAuth ids
pnpm build                   # build the shared packages/* once (so module imports resolve)
pnpm db:up && pnpm db:migrate && pnpm db:seed
```

### Per module

1. **Branch it** — one branch per module keeps your work isolated and reviewable:
   `git switch -c learn/07-react-hooks-ii`.
2. **Pick a depth lane** (🟢 app · 🟡 balanced · 🔴 deep) — 🔴 forbids the obvious library on
   purpose. You can mix lanes task-by-task.
3. **Read the README, then code in `src/`.** `WE` tasks ship a solved reference next to a stub
   you complete by analogy; `TODO`/`FS` stubs `throw new Error("TODO…")` with hint-only
   docstrings. Never edit `solution/` — that's the gated answer key.
4. **Grade yourself.** Tests import from `solution/`, so a plain `pnpm --filter … test` is
   green out of the box and grades the answer key, not your code. Run **`pnpm grade <id>`**
   (e.g. `pnpm grade 07-react-hooks-ii`) — it flips the test imports to `../src/`, runs the
   module suite, and restores them automatically, so a green result reflects _your_ work.
   (Manual path: flip a test's `../solution/x.js` import to `../src/x.js`, run it red → green,
   then restore.) Typecheck stays: `pnpm turbo run typecheck --filter=./modules/07-react-hooks-ii...`.
5. **Track + commit.** Mark the row in `PROGRESS.md` (or let `/progress` do it), then commit.
6. **Stuck or curious?** `/tutor <id> <question>` for a hint-first tutor; `/exam <id>` for a
   5-question check.

### Proposed order

Foundations gate everything; the frontend and backend tracks can run in parallel, then
converge. A safe linear path (companions `NNx` are optional deep-dives — take them inline or
skip):

1. **Foundations** — `00 → 01 → 02 → 03 → 04`
2. **Frontend core** — `05 (+05b, 05c) → 06 → 07 (+07b) → 08 (+08b) → 09 → 10 (+10b) → 11 (+11b)`
3. **Client state & data** — `12 → 13 (+13b) → 14 (+14b)`
4. **Backend & data** — `15 → 16 → 17 → 18 → 19 → 20 (+20b)`
5. **Cross-cutting** — `21 (+21b) → 22 → 23 (+23b) → 24 (+24b) → 25 → 26`
6. **Ops & performance** — `27 → 28 (+28b, +28c)`
7. **Capstone** — `29`

Not starting from zero? Run **`learning-plan`** — it evaluates what you already know (and your
target role/capstone), then writes a personalized, prereq-respecting order to
`PERSONAL_LEARN_PLAN.md` (skip what you have, deepen what your goal needs). Full prereq detail:
[`CURRICULUM.md`](./CURRICULUM.md).

## Getting started

Prerequisites: Node ≥ 20, pnpm, Docker Desktop, git. Comfortable with JavaScript basics.

```bash
pnpm install                 # + registers Husky hooks
cp .env.example .env         # fill DATABASE_URL, AUTH_SECRET, JWT_SECRET, OAuth ids
pnpm db:up && pnpm db:migrate && pnpm db:seed

pnpm dev                     # run app dev servers (turbo)
pnpm storybook               # packages/ui component library (:6006)
pnpm typecheck && pnpm test  # quality gates

# run one module exercise (learn-ai style)
tsx modules/04-node-fundamentals/src/01-http-server.ts
pnpm --filter ./modules/06-react-hooks-i dev
```

> ⚠️ This repo is built out incrementally; modules and apps are scaffolded module by
> module, and a module's `README.md` is the source of truth for what exists. If a lesson
> is missing, fall back to `CURRICULUM.md`.

## Layout

```text
apps/        # the two capstones: kanban-web/-api, chat-web/-api
packages/    # shared spine: config, ui, db, auth, api-client, testing, shared, tsconfig
modules/     # the lessons (00-29 + companions); each: README.md + src/ + solution/
docs/        # CAPSTONES + AUTH_COMPARISON, TESTING, REALTIME, STYLING, GLOSSARY
.claude/     # /tutor, /exam commands + check-progress, jd-gap-analysis, scaffold-module skills
```

## License

MIT.
