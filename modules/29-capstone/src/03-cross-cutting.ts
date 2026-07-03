/**
 * Task 3 — Cross-cutting concerns for both slices (EXT, worked reference).
 *
 * The two slices ship behind the same operational spine. This file assembles three descriptors/
 * wrappers, all pure and injectable:
 *
 *   - `buildTestPlan()` — a testing-trophy-shaped plan for BOTH slices (static → unit →
 *     integration → e2e), naming each slice's auth stack and its cases;
 *   - `withObservability(name, fn, deps)` — the observability envelope a slice action runs in. It
 *     opens ONE trace span and, on settle, emits exactly one span + one structured log to an
 *     INJECTED sink, LINKED by a shared `traceId`. Times come from an injected clock, the id from
 *     an injected id source (never `Date.now()`/`Math.random()`);
 *   - `buildDeployPlan()` — the CI/deploy plan for the two DIFFERENT stacks (Kanban = Auth.js
 *     session, Chat = JWT/Passport), each with `migrate` ordered BEFORE `release`.
 */

/* ───────────────────────────── test plan (trophy) ───────────────────────────── */

export type TrophyLayer = "static" | "unit" | "integration" | "e2e";

export interface SliceTestPlan {
  slice: "kanban" | "chat";
  authStack: string;
  layers: { layer: TrophyLayer; cases: string[] }[];
}

export interface TestPlan {
  slices: SliceTestPlan[];
  totalCases: number;
}

/** Combined trophy-style plan for both slices. `totalCases` sums every layer's cases. */
export function buildTestPlan(): TestPlan {
  const slices: SliceTestPlan[] = [
    {
      slice: "kanban",
      authStack: "authjs-session",
      layers: [
        { layer: "static", cases: ["tsc --noEmit", "zod input schemas"] },
        { layer: "unit", cases: ["moveReducer purity", "requireSession guard"] },
        {
          layer: "integration",
          cases: ["BoardService CRUD over repo", "optimistic reconcile"],
        },
        { layer: "e2e", cases: ["drag a card across columns"] },
      ],
    },
    {
      slice: "chat",
      authStack: "jwt-passport",
      layers: [
        { layer: "static", cases: ["tsc --noEmit"] },
        { layer: "unit", cases: ["verifyChatToken exp", "history ordering"] },
        { layer: "integration", cases: ["gateway broadcasts to room members only"] },
        { layer: "e2e", cases: ["send a message, see it live in the room"] },
      ],
    },
  ];
  const totalCases = slices.reduce(
    (sum, slice) =>
      sum + slice.layers.reduce((layerSum, layer) => layerSum + layer.cases.length, 0),
    0,
  );
  return { slices, totalCases };
}

/* ───────────────────────────── observability ───────────────────────────── */

/** Injected clock — `now()` is read once at span start and once at span end. */
export interface Clock {
  now(): number;
}

/** Injected id source for trace ids — never `Math.random()`. */
export interface IdSource {
  next(): string;
}

export interface TraceSpan {
  traceId: string;
  name: string;
  startedAt: number;
  endedAt: number;
  durationMs: number;
  ok: boolean;
}

export interface LogRecord {
  level: "info" | "error";
  traceId: string;
  action: string;
  msg: string;
}

/** The telemetry boundary — a real backend (OTel/pino) or a test sink implements it. */
export interface ObservabilitySink {
  span(span: TraceSpan): void;
  log(record: LogRecord): void;
}

/**
 * Wrap a slice action in one trace span + one structured log, LINKED by a shared `traceId`. On
 * success the span is `ok:true` and the log is `info`; if `fn` throws, the span is `ok:false`,
 * the log is `error` with the thrown message, and the error is RE-THROWN (never swallowed).
 * Exactly one span and one log are emitted per call.
 */
export async function withObservability<T>(
  name: string,
  fn: (ctx: { traceId: string }) => Promise<T>,
  deps: { sink: ObservabilitySink; clock: Clock; ids: IdSource },
): Promise<T> {
  const { sink, clock, ids } = deps;
  const traceId = ids.next();
  const startedAt = clock.now();
  try {
    const result = await fn({ traceId });
    const endedAt = clock.now();
    sink.span({
      traceId,
      name,
      startedAt,
      endedAt,
      durationMs: endedAt - startedAt,
      ok: true,
    });
    sink.log({ level: "info", traceId, action: name, msg: "ok" });
    return result;
  } catch (err) {
    const endedAt = clock.now();
    sink.span({
      traceId,
      name,
      startedAt,
      endedAt,
      durationMs: endedAt - startedAt,
      ok: false,
    });
    sink.log({ level: "error", traceId, action: name, msg: (err as Error).message });
    throw err;
  }
}

/* ───────────────────────────── deploy plan ───────────────────────────── */

export interface AppDeployPlan {
  app: "kanban" | "chat";
  authStack: string;
  runtime: string;
  /** Ordered release steps; `migrate` MUST precede `release`. */
  steps: string[];
}

export interface DeployPlan {
  apps: AppDeployPlan[];
}

/**
 * CI/deploy plan for the two DIFFERENT stacks. Each app runs `migrate` before `release` so the
 * schema is ready before new code serves traffic; the apps deliberately carry different auth
 * stacks (Auth.js session vs JWT/Passport).
 */
export function buildDeployPlan(): DeployPlan {
  return {
    apps: [
      {
        app: "kanban",
        authStack: "authjs-session",
        runtime: "next-rsc",
        steps: ["install", "build", "migrate", "release", "smoke"],
      },
      {
        app: "chat",
        authStack: "jwt-passport",
        runtime: "nest-ws",
        steps: ["install", "build", "migrate", "release", "smoke"],
      },
    ],
  };
}
