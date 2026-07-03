/**
 * Task 3 — CI pipeline (TODO) — SOLUTION.
 */

export interface WorkflowStep {
  name: string;
  uses?: string;
  run?: string;
  with?: Record<string, string>;
}

export interface BuildJob {
  "runs-on": string;
  strategy: { matrix: { node: number[] } };
  steps: WorkflowStep[];
}

export interface CIWorkflow {
  name: string;
  on: { push: { branches: string[] }; pull_request: Record<string, never> };
  jobs: { build: BuildJob };
}

export function buildCIWorkflow(): CIWorkflow {
  return {
    name: "CI",
    on: { push: { branches: ["main"] }, pull_request: {} },
    jobs: {
      build: {
        "runs-on": "ubuntu-latest",
        strategy: { matrix: { node: [20, 22] } },
        steps: [
          { name: "Checkout", uses: "actions/checkout@v4" },
          { name: "Setup pnpm", uses: "pnpm/action-setup@v4" },
          {
            name: "Setup Node",
            uses: "actions/setup-node@v4",
            with: { "node-version": "${{ matrix.node }}", cache: "pnpm" },
          },
          {
            name: "Cache turbo",
            uses: "actions/cache@v4",
            with: {
              path: ".turbo",
              key: "${{ runner.os }}-turbo-${{ github.sha }}",
              "restore-keys": "${{ runner.os }}-turbo-",
            },
          },
          { name: "Install", run: "pnpm install --frozen-lockfile" },
          { name: "Typecheck", run: "pnpm turbo run typecheck" },
          { name: "Lint", run: "pnpm turbo run lint" },
          { name: "Test", run: "pnpm turbo run test" },
          { name: "Build", run: "pnpm turbo run build" },
        ],
      },
    },
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function scalar(value: unknown): string {
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return JSON.stringify(value);
}

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
