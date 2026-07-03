import { describe, expect, it } from "vitest";
import { retry, withTimeout } from "../solution/01-async.js";

describe("retry", () => {
  it("succeeds after transient failures", async () => {
    let calls = 0;
    const result = await retry(
      async () => {
        calls++;
        if (calls < 3) throw new Error("flaky");
        return "ok";
      },
      { retries: 3, delayMs: 0 },
    );
    expect(result).toBe("ok");
    expect(calls).toBe(3);
  });

  it("rethrows the last error when all attempts fail", async () => {
    await expect(
      retry(
        async () => {
          throw new Error("nope");
        },
        { retries: 2, delayMs: 0 },
      ),
    ).rejects.toThrow("nope");
  });
});

describe("withTimeout", () => {
  it("resolves when the promise is fast", async () => {
    await expect(withTimeout(Promise.resolve("fast"), 50)).resolves.toBe("fast");
  });
  it("rejects with 'timeout' when the promise is slow", async () => {
    const slow = new Promise((r) => setTimeout(r, 50));
    await expect(withTimeout(slow, 5)).rejects.toThrow("timeout");
  });
});
