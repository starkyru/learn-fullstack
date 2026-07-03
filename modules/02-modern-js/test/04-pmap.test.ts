import { describe, expect, it } from "vitest";
import { pMap } from "../solution/04-pmap.js";

describe("pMap", () => {
  it("preserves input order regardless of completion order", async () => {
    const out = await pMap(
      [30, 10, 20],
      (ms) => new Promise<number>((r) => setTimeout(() => r(ms * 2), ms)),
      { concurrency: 3 },
    );
    expect(out).toEqual([60, 20, 40]);
  });

  it("never exceeds the concurrency cap", async () => {
    let inFlight = 0;
    let peak = 0;
    await pMap(
      [1, 2, 3, 4, 5, 6],
      async () => {
        inFlight++;
        peak = Math.max(peak, inFlight);
        await new Promise((r) => setTimeout(r, 5));
        inFlight--;
      },
      { concurrency: 2 },
    );
    expect(peak).toBeLessThanOrEqual(2);
  });
});
