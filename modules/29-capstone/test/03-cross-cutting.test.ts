import { describe, expect, it } from "vitest";
import {
  buildDeployPlan,
  buildTestPlan,
  withObservability,
  type Clock,
  type IdSource,
  type LogRecord,
  type ObservabilitySink,
  type TraceSpan,
} from "../solution/03-cross-cutting.js";

// A clock whose `now()` advances by `step` ms each call: first read = span start, second = end.
function tickingClock(start: number, step: number): Clock {
  let t = start;
  return {
    now() {
      const cur = t;
      t += step;
      return cur;
    },
  };
}

function seqIds(prefix: string): IdSource {
  let n = 0;
  return { next: () => `${prefix}-${++n}` };
}

function collectingSink(): ObservabilitySink & { spans: TraceSpan[]; logs: LogRecord[] } {
  const spans: TraceSpan[] = [];
  const logs: LogRecord[] = [];
  return { spans, logs, span: (s) => spans.push(s), log: (r) => logs.push(r) };
}

describe("withObservability", () => {
  it("emits one trace span + one structured log, linked by traceId, on success", async () => {
    const sink = collectingSink();
    const result = await withObservability("kanban.moveCard", async () => "moved", {
      sink,
      clock: tickingClock(1000, 5),
      ids: seqIds("trace"),
    });

    expect(result).toBe("moved");
    expect(sink.spans).toEqual([
      {
        traceId: "trace-1",
        name: "kanban.moveCard",
        startedAt: 1000,
        endedAt: 1005,
        durationMs: 5,
        ok: true,
      },
    ]);
    expect(sink.logs).toEqual([
      { level: "info", traceId: "trace-1", action: "kanban.moveCard", msg: "ok" },
    ]);
    // Linked: the span and its log share the one trace id.
    expect(sink.logs[0]?.traceId).toBe(sink.spans[0]?.traceId);
  });

  it("marks the span failed, logs the error, and re-throws when the action throws", async () => {
    const sink = collectingSink();
    await expect(
      withObservability(
        "chat.post",
        async () => {
          throw new Error("db offline");
        },
        { sink, clock: tickingClock(2000, 7), ids: seqIds("trace") },
      ),
    ).rejects.toThrow("db offline");

    expect(sink.spans).toEqual([
      {
        traceId: "trace-1",
        name: "chat.post",
        startedAt: 2000,
        endedAt: 2007,
        durationMs: 7,
        ok: false,
      },
    ]);
    expect(sink.logs).toEqual([
      { level: "error", traceId: "trace-1", action: "chat.post", msg: "db offline" },
    ]);
  });
});

describe("buildDeployPlan", () => {
  it("uses the two DIFFERENT auth stacks for the two apps", () => {
    const { apps } = buildDeployPlan();
    const kanban = apps.find((a) => a.app === "kanban");
    const chat = apps.find((a) => a.app === "chat");
    expect(kanban?.authStack).toBe("authjs-session");
    expect(chat?.authStack).toBe("jwt-passport");
    expect(kanban?.authStack).not.toBe(chat?.authStack);
  });

  it("orders migrate BEFORE release for every app", () => {
    for (const app of buildDeployPlan().apps) {
      const migrate = app.steps.indexOf("migrate");
      const release = app.steps.indexOf("release");
      expect(migrate).toBeGreaterThanOrEqual(0);
      expect(release).toBeGreaterThan(migrate);
    }
  });
});

describe("buildTestPlan", () => {
  it("plans both slices as a trophy and sums every case", () => {
    const plan = buildTestPlan();
    expect(plan.slices.map((s) => s.slice)).toEqual(["kanban", "chat"]);

    const chat = plan.slices.find((s) => s.slice === "chat");
    expect(chat?.authStack).toBe("jwt-passport");
    expect(chat?.layers.map((l) => l.layer)).toEqual([
      "static",
      "unit",
      "integration",
      "e2e",
    ]);

    const kanban = plan.slices.find((s) => s.slice === "kanban");
    expect(kanban?.authStack).toBe("authjs-session");
    // Kanban's integration layer must name both integration cases exactly.
    expect(kanban?.layers.find((l) => l.layer === "integration")?.cases).toEqual([
      "BoardService CRUD over repo",
      "optimistic reconcile",
    ]);

    // Hand-counted: kanban 2+2+2+1 = 7, chat 1+2+1+1 = 5 → 12.
    expect(plan.totalCases).toBe(12);
  });
});
