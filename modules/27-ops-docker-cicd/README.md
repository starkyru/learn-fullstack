# Module 27 — Ops: Docker, CI/CD & Deploy 🟡

> **Depth lanes** 🟢 App · 🟡 Balanced · 🔴 Deep · **Task types** WE / TODO / FS / EXT

Ship the chat API and the Kanban web app the way a real team does: a **multi-stage Dockerfile**, a
one-command **Compose stack** (Postgres + API + web), a **GitHub Actions** pipeline with turbo
caching, and an ordered **deploy plan** that runs migrations before switching traffic. The catch —
you can't unit-test `docker build`, `docker compose up`, a GitHub runner, or a Vercel deploy at gate
time. So the doctrine here is: **the testable logic is the config generator.** Each task builds the
Dockerfile / Compose object / workflow object from a typed JS value, and the tests assert that
value's exact shape. The real `Dockerfile`, `compose.yml`, and `.github/workflows/ci.yml` are checked
in as **artifacts** the module documents but the gate never executes.

## Concepts

- **A multi-stage build is `deps → build → runtime`** — install from the manifests alone (so the
  layer is cached until the lockfile changes), compile in a build stage, then copy only
  `node_modules` + the build output into a slim runtime stage that drops to a **non-root `USER`** and
  adds a `HEALTHCHECK`. `buildDockerfile(opts)` emits exactly those three stages; the chat API sets a
  port + health path, the background worker (no HTTP surface) sets neither — so it emits no `EXPOSE`
  and no `HEALTHCHECK`.
- **Config-as-data beats config-as-text** — build a typed object (`buildComposeConfig()`,
  `buildCIWorkflow()`) and keep serialization a separate, tiny pure function (`toYaml`). The object
  is trivially deep-equal-assertable; the serializer is a small unit with block-style rules
  (records, arrays, and — for the CI step list — arrays of records). No YAML dependency.
- **A deploy is an ordering with an invariant** — `build → migrate → release → verify`, where
  **migrate must precede release** (release = switch traffic) or the new code meets a schema the DB
  hasn't got yet. Kanban → Vercel, chat API → Railway/Fly. And a deploy fails closed on secrets: the
  checklist validator is `ok` only when every required secret is present and non-empty.

## Tasks

| #   | Task          | Lane | Type | What you build                                                             |
| --- | ------------- | ---- | ---- | -------------------------------------------------------------------------- |
| 1   | Dockerize     | 🟢   | WE   | solved multi-stage Dockerfile for chat API + analog worker Dockerfile stub |
| 2   | Compose stack | 🟡   | TODO | compose: Postgres + API + web; one docker compose up                       |
| 3   | CI pipeline   | 🟡   | TODO | GH Actions: install→typecheck→lint→test→build with turbo cache             |
| 4   | Deploy        | 🟢   | EXT  | Kanban→Vercel, chat API→Railway/Fly; run migrations on deploy              |

## Theory & docs

- **Dockerize** — [multi-stage builds](https://docs.docker.com/build/building/multi-stage/),
  [Dockerfile reference](https://docs.docker.com/reference/dockerfile/) (`USER`, `EXPOSE`,
  `HEALTHCHECK`, `COPY --from`).
- **Compose stack** — [Docker Compose docs](https://docs.docker.com/compose/),
  [Compose file reference](https://docs.docker.com/reference/compose-file/) (`depends_on`
  conditions, healthchecks, volumes).
- **CI pipeline** — [GitHub Actions docs](https://docs.github.com/en/actions),
  [workflow syntax](https://docs.github.com/en/actions/reference/workflow-syntax-for-github-actions),
  [caching dependencies](https://docs.github.com/en/actions/using-workflows/caching-dependencies-to-speed-up-workflows).
- **Deploy** — [Vercel docs](https://vercel.com/docs), [Railway docs](https://docs.railway.com/),
  [Fly.io docs](https://fly.io/docs/) — the three targets `buildDeployPlan` emits commands for.

## Done when

- [ ] `buildDockerfile(opts)` emits stages in `deps → build → runtime` order with `COPY --from=build`,
      `USER node`, and (for the API) an `EXPOSE`+`HEALTHCHECK`; `buildWorkerDockerfile()` mirrors it
      but, having no port, emits **no** `EXPOSE`/`HEALTHCHECK` and runs `dist/worker.js`. A real
      `Dockerfile` artifact matches `buildApiDockerfile()` byte-for-byte.
- [ ] `buildComposeConfig()` returns the `postgres` + `api` + `web` object with `depends_on`
      (`service_healthy` / `service_started`), the pg `healthcheck`, `["3000:3000"]` ports, and the
      named `pgdata` volume; `toYaml` serializes those key fields at the right indentation.
- [ ] `buildCIWorkflow()` returns one `build` job whose steps run
      `Install → Typecheck → Lint → Test → Build` over a `[20, 22]` node matrix, with an
      `actions/cache@v4` step keyed `${{ runner.os }}-turbo-${{ github.sha }}`; `toYaml` renders the
      step list (array of records) correctly.
- [ ] `buildDeployPlan(target)` orders `build → migrate → release → verify` with **migrate before
      release** and the right provider command (Vercel / Railway / Fly); `validateSecrets` returns
      `{ ok: true, missing: [] }` when all secrets are set and lists the missing ones otherwise.

> **Worked example (WE):** `buildDockerfile` + `buildApiDockerfile` are solved in **both** `src/` and
> `solution/`; the analog `buildWorkerDockerfile` throws `TODO` in `src/` — implement it by reusing the
> engine. **TODO** tasks throw in `src/`; keep the signature and return shape, implement the body.
> **EXT** (task 4) ships whole in `src/` — read the deploy plan + validator and extend it. Tests import
> from `solution/`; point them at `../src/...` to grade your own build. The `Dockerfile`, `compose.yml`,
> and `.github/workflows/ci.yml` are **artifacts** the module documents; the gate does not execute them.
