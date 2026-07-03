/**
 * Task 1 — Dockerize (WORKED EXAMPLE) — SOLUTION.
 *
 * Identical engine to `src/`, with the analog worker filled in.
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

/** The reference engine: turn `opts` into a three-stage Dockerfile string. */
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

/** The analog worker Dockerfile — same stages + non-root user, but no EXPOSE/HEALTHCHECK. */
export function buildWorkerDockerfile(): string {
  return buildDockerfile(WORKER_DOCKERFILE_OPTS);
}
