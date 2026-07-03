/**
 * Task 2 — Compose stack (TODO).
 *
 * Return a typed Compose object — `postgres` + `api` + `web`, wired with `depends_on`, a Postgres
 * `healthcheck`, and a named `volume` — then serialize it with a hand-rolled `toYaml` (NO yaml dep).
 * The point of building the object first is that it is trivially assertable (deep-equal the shape),
 * and the serializer is a small, testable pure function. A `compose.yml` artifact is checked in.
 *
 * Everything is a pure data/string transform — no clock, no randomness.
 */

/** A Postgres-style healthcheck block. */
export interface HealthCheck {
  test: readonly string[];
  interval: string;
  timeout: string;
  retries: number;
}

/** `depends_on` in long form: each dependency gates on a condition. */
export type DependsOn = Record<string, { condition: string }>;

export interface PostgresService {
  image: string;
  environment: Record<string, string>;
  ports: readonly string[];
  volumes: readonly string[];
  healthcheck: HealthCheck;
}

export interface BuildService {
  build: { context: string; dockerfile: string };
  environment: Record<string, string>;
  ports: readonly string[];
  depends_on: DependsOn;
}

export interface ComposeConfig {
  services: {
    postgres: PostgresService;
    api: BuildService;
    web: BuildService;
  };
  volumes: Record<string, Record<string, never>>;
}

/**
 * YOUR TURN — return the Compose object with EXACTLY this wiring:
 *   - `services.postgres`: image "postgres:16-alpine"; env POSTGRES_USER/PASSWORD/DB all "app";
 *     ports ["5432:5432"]; volumes ["pgdata:/var/lib/postgresql/data"]; healthcheck
 *     { test: ["CMD-SHELL", "pg_isready -U app"], interval: "10s", timeout: "5s", retries: 5 }.
 *   - `services.api`: build { context: ".", dockerfile: "Dockerfile" };
 *     env DATABASE_URL "postgres://app:app@postgres:5432/app", NODE_ENV "production";
 *     ports ["3000:3000"]; depends_on { postgres: { condition: "service_healthy" } }.
 *   - `services.web`: build { context: ".", dockerfile: "web.Dockerfile" };
 *     env API_URL "http://api:3000"; ports ["8080:80"];
 *     depends_on { api: { condition: "service_started" } }.
 *   - `volumes`: { pgdata: {} }.
 */
export function buildComposeConfig(): ComposeConfig {
  throw new Error(
    "TODO: return the postgres+api+web Compose object (depends_on, healthcheck, pgdata volume)",
  );
}

/**
 * YOUR TURN — a minimal YAML serializer (block style, 2-space indent). Support:
 *   - records → `key:` then, for object/array values, a newline + the value indented one level;
 *     scalar values inline as `key: <scalar>` (an empty object prints `key: {}`).
 *   - arrays → one `- <item>` per line; an item that is itself a record renders its first key on
 *     the `- ` line and the rest indented to match (needed by the CI workflow's step list in task 3).
 *   - scalars: strings double-quoted (so `host:port` never confuses YAML), numbers/booleans raw.
 * Return the joined string WITHOUT a trailing newline.
 */
export function toYaml(_value: unknown, _indent = 0): string {
  throw new Error(
    "TODO: implement a minimal block-style YAML serializer (records/arrays/scalars)",
  );
}
