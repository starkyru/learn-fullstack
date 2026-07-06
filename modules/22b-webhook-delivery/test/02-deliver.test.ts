import { describe, expect, it } from "vitest";
import { deliver, type Transport } from "../solution/02-deliver.js";

/** A transport that returns each scripted status in turn (throws `NET` where the script says 0). */
function scriptedTransport(statuses: number[]): {
  transport: Transport;
  calls: () => number;
} {
  let i = 0;
  const transport: Transport = async () => {
    const status = statuses[i++]!;
    if (status === 0) throw new Error("NET");
    return { status };
  };
  return { transport, calls: () => i };
}

/** Records the backoff delays instead of waiting. */
function recordingSleep(): { sleep: (ms: number) => Promise<void>; delays: number[] } {
  const delays: number[] = [];
  return { sleep: async (ms) => void delays.push(ms), delays };
}

describe("deliver", () => {
  it("succeeds after transient 5xx retries and reports every status", async () => {
    const { transport } = scriptedTransport([500, 503, 200]);
    const { sleep, delays } = recordingSleep();
    const res = await deliver("https://p/hook", "body", {
      transport,
      sleep,
      baseDelayMs: 100,
    });
    expect(res).toEqual({ ok: true, attempts: 3, statuses: [500, 503, 200] });
    // Exponential backoff between attempts: 100 * 2^0, 100 * 2^1. No sleep after the success.
    expect(delays).toEqual([100, 200]);
  });

  it("does NOT retry a permanent 4xx", async () => {
    const { transport, calls } = scriptedTransport([400, 200]);
    const { sleep, delays } = recordingSleep();
    const res = await deliver("https://p/hook", "body", { transport, sleep });
    expect(res).toEqual({ ok: false, attempts: 1, statuses: [400] });
    expect(calls()).toBe(1);
    expect(delays).toEqual([]);
  });

  it("retries a 429 (rate limited is transient)", async () => {
    const { transport } = scriptedTransport([429, 200]);
    const { sleep } = recordingSleep();
    const res = await deliver("https://p/hook", "body", { transport, sleep });
    expect(res).toEqual({ ok: true, attempts: 2, statuses: [429, 200] });
  });

  it("treats a thrown transport (network error) as transient status 0", async () => {
    const { transport } = scriptedTransport([0, 200]);
    const { sleep, delays } = recordingSleep();
    const res = await deliver("https://p/hook", "body", {
      transport,
      sleep,
      baseDelayMs: 50,
    });
    expect(res).toEqual({ ok: true, attempts: 2, statuses: [0, 200] });
    expect(delays).toEqual([50]);
  });

  it("gives up after maxAttempts and never sleeps after the last try", async () => {
    const { transport } = scriptedTransport([500, 500, 500]);
    const { sleep, delays } = recordingSleep();
    const res = await deliver("https://p/hook", "body", {
      transport,
      sleep,
      maxAttempts: 3,
      baseDelayMs: 100,
    });
    expect(res).toEqual({ ok: false, attempts: 3, statuses: [500, 500, 500] });
    expect(delays).toEqual([100, 200]); // two waits for three attempts
  });
});
