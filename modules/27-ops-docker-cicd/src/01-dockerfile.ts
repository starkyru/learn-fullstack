/**
 * Task 1 — Dockerize (WORKED EXAMPLE).
 *
 * `buildDockerfile(opts)` below is the fully-solved reference: it emits a **multi-stage** Dockerfile
 * text as three stages — `deps` → `build` → `runtime` — that switches to a **non-root user** and
 * (for an HTTP service) adds a `HEALTHCHECK`. `buildApiDockerfile()` wires it for the chat API.
 *
 * Read those, then do YOUR TURN — implement `buildWorkerDockerfile` so the background worker
 * (no HTTP surface → no `EXPOSE`, no HTTP `HEALTHCHECK`) reuses the same engine with its own opts.
 *
 * Everything is a pure string transform: no `Date.now()`/`Math.random()`, so the output is byte-for-byte
 * deterministic and asserted line-for-line by the test. A real `Dockerfile` artifact — the exact output
 * of `buildApiDockerfile()` — is checked in at the module root; this generator is where it comes from.
 */

/** Options describing one service's image. Sensible npm defaults keep the chat-API call terse. */
export interface DockerfileOpts {
  /** Base image used for every stage, e.g. "node:20-alpine". */
  image: string;
  /** Working directory inside each stage. Default "/app". */
  workdir?: string;
  /** Manifests copied into the `deps` stage before install (lockfile-aware layer caching). */
  manifests?: readonly string[];
  /** Install command run in the `deps` stage. Default "npm ci". */
  install?: string;
  /** Build command run in the `build` stage. Default "npm run build". */
  build?: string;
  /** Directory the `build` stage emits and the `runtime` stage copies. Default "dist". */
  outDir?: string;
  /** Non-root user the `runtime` stage switches to via `USER`. Default "node". */
  user?: string;
  /** NODE_ENV baked into the `runtime` stage. Default "production". */
  nodeEnv?: string;
  /** If set, the `runtime` stage `EXPOSE`s this port (and, with `healthPath`, adds a HEALTHCHECK). */
  port?: number;
  /** If set together with `port`, an HTTP `HEALTHCHECK` hitting this path. */
  healthPath?: string;
  /** The runtime `CMD` in exec form, e.g. `["node", "dist/main.js"]`. */
  cmd: readonly string[];
}

/**
 * The reference engine: turn `opts` into a three-stage Dockerfile string.
 *
 * Stage order is load-bearing: `deps` installs from the manifests only (so the layer is cached until
 * the lockfile changes), `build` compiles against those `node_modules`, and the slim `runtime` stage
 * copies just `node_modules` + the build output, drops to a non-root `USER`, then runs `CMD`.
 */
export function buildDockerfile(opts: DockerfileOpts): string {
  const workdir = opts.workdir ?? "/app";
  const manifests = opts.manifests ?? ["package.json", "package-lock.json"];
  const install = opts.install ?? "npm ci";
  const build = opts.build ?? "npm run build";
  const outDir = opts.outDir ?? "dist";
  const user = opts.user ?? "node";
  const nodeEnv = opts.nodeEnv ?? "production";

  const deps = [
    `FROM ${opts.image} AS deps`,
    `WORKDIR ${workdir}`,
    `COPY ${manifests.join(" ")} ./`,
    `RUN ${install}`,
  ];

  const buildStage = [
    `FROM ${opts.image} AS build`,
    `WORKDIR ${workdir}`,
    `COPY --from=deps ${workdir}/node_modules ./node_modules`,
    `COPY . .`,
    `RUN ${build}`,
  ];

  const runtime = [
    `FROM ${opts.image} AS runtime`,
    `WORKDIR ${workdir}`,
    `ENV NODE_ENV=${nodeEnv}`,
    `COPY --from=deps ${workdir}/node_modules ./node_modules`,
    `COPY --from=build ${workdir}/${outDir} ./${outDir}`,
    `USER ${user}`,
  ];
  if (opts.port !== undefined) runtime.push(`EXPOSE ${opts.port}`);
  if (opts.port !== undefined && opts.healthPath !== undefined) {
    runtime.push(
      `HEALTHCHECK --interval=30s --timeout=3s --retries=3 CMD wget -qO- http://localhost:${opts.port}${opts.healthPath} || exit 1`,
    );
  }
  runtime.push(`CMD [${opts.cmd.map((c) => JSON.stringify(c)).join(", ")}]`);

  return [deps, buildStage, runtime].map((stage) => stage.join("\n")).join("\n\n") + "\n";
}

/** Opts for the chat API image: an HTTP service on :3000 with a `/healthz` probe. */
export const API_DOCKERFILE_OPTS: DockerfileOpts = {
  image: "node:20-alpine",
  port: 3000,
  healthPath: "/healthz",
  cmd: ["node", "dist/main.js"],
};

/** The WORKED chat-API Dockerfile — the exact bytes checked in as the `Dockerfile` artifact. */
export function buildApiDockerfile(): string {
  return buildDockerfile(API_DOCKERFILE_OPTS);
}

/** Opts for the background worker: NO port and NO HTTP healthcheck — it has no HTTP surface. */
export const WORKER_DOCKERFILE_OPTS: DockerfileOpts = {
  image: "node:20-alpine",
  cmd: ["node", "dist/worker.js"],
};

/**
 * YOUR TURN (analog) — build the worker Dockerfile by REUSING the engine:
 *   1. `return buildDockerfile(WORKER_DOCKERFILE_OPTS);`
 *   2. That yields the same `deps → build → runtime` stages and `USER node`, but — because the worker
 *      opts set no `port`/`healthPath` — it emits NO `EXPOSE` and NO `HEALTHCHECK` line, and its
 *      `CMD` is `["node", "dist/worker.js"]`.
 */
export function buildWorkerDockerfile(): string {
  throw new Error(
    "TODO: return buildDockerfile(WORKER_DOCKERFILE_OPTS) — multi-stage, USER node, no EXPOSE/HEALTHCHECK",
  );
}
