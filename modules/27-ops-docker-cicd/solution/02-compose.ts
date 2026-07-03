/**
 * Task 2 — Compose stack (TODO) — SOLUTION.
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

export function buildComposeConfig(): ComposeConfig {
  return {
    services: {
      postgres: {
        image: "postgres:16-alpine",
        environment: {
          POSTGRES_USER: "app",
          POSTGRES_PASSWORD: "app",
          POSTGRES_DB: "app",
        },
        ports: ["5432:5432"],
        volumes: ["pgdata:/var/lib/postgresql/data"],
        healthcheck: {
          test: ["CMD-SHELL", "pg_isready -U app"],
          interval: "10s",
          timeout: "5s",
          retries: 5,
        },
      },
      api: {
        build: { context: ".", dockerfile: "Dockerfile" },
        environment: {
          DATABASE_URL: "postgres://app:app@postgres:5432/app",
          NODE_ENV: "production",
        },
        ports: ["3000:3000"],
        depends_on: { postgres: { condition: "service_healthy" } },
      },
      web: {
        build: { context: ".", dockerfile: "web.Dockerfile" },
        environment: { API_URL: "http://api:3000" },
        ports: ["8080:80"],
        depends_on: { api: { condition: "service_started" } },
      },
    },
    volumes: { pgdata: {} },
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Serialize a scalar. Strings are double-quoted so `host:port` values never confuse YAML. */
function scalar(value: unknown): string {
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return JSON.stringify(value);
}

/** Render one `key: value` line (or key + indented block for object/array values). */
function renderKey(key: string, val: unknown, indent: number): string {
  const pad = "  ".repeat(indent);
  if (isRecord(val)) {
    if (Object.keys(val).length === 0) return `${pad}${key}: {}`;
    return `${pad}${key}:\n${toYaml(val, indent + 1)}`;
  }
  if (Array.isArray(val)) {
    if (val.length === 0) return `${pad}${key}: []`;
    return `${pad}${key}:\n${toYaml(val, indent + 1)}`;
  }
  return `${pad}${key}: ${scalar(val)}`;
}

/** Render one array item: `- scalar`, or a record with its first key on the dash line. */
function renderItem(item: unknown, indent: number): string {
  const pad = "  ".repeat(indent);
  if (isRecord(item) || Array.isArray(item)) {
    const base = (indent + 1) * 2;
    const lines = toYaml(item, indent + 1).split("\n");
    return lines
      .map((line, i) => {
        const stripped = line.slice(base);
        return i === 0 ? `${pad}- ${stripped}` : `${pad}  ${stripped}`;
      })
      .join("\n");
  }
  return `${pad}- ${scalar(item)}`;
}

/** A minimal block-style YAML serializer — records, arrays (incl. arrays of records), scalars. */
export function toYaml(value: unknown, indent = 0): string {
  const pad = "  ".repeat(indent);
  if (isRecord(value)) {
    const keys = Object.keys(value);
    if (keys.length === 0) return `${pad}{}`;
    return keys.map((k) => renderKey(k, value[k], indent)).join("\n");
  }
  if (Array.isArray(value)) {
    if (value.length === 0) return `${pad}[]`;
    return value.map((item) => renderItem(item, indent)).join("\n");
  }
  return `${pad}${scalar(value)}`;
}
