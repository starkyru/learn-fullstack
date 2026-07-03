import { describe, expect, it } from "vitest";
import {
  firstDuplicateFast,
  firstDuplicateNaive,
  type OpCounter,
  worstCaseInput,
} from "../solution/03-slowdown.js";

const counter = (): OpCounter => ({ ops: 0 });

describe("firstDuplicate — identical results, two costs", () => {
  it("both find the value at its second occurrence", () => {
    const input = [10, 20, 30, 40, 10];
    expect(firstDuplicateNaive(input, counter())).toBe(10);
    expect(firstDuplicateFast(input, counter())).toBe(10);
  });

  it("both return undefined when there is no duplicate", () => {
    const input = [1, 2, 3];
    expect(firstDuplicateNaive(input, counter())).toBeUndefined();
    expect(firstDuplicateFast(input, counter())).toBeUndefined();
  });

  it("agree on every value across several inputs", () => {
    const inputs = [[], [7], [1, 1], [3, 1, 4, 1, 5], [2, 4, 6, 8, 2]];
    for (const input of inputs) {
      expect(firstDuplicateFast(input, counter())).toBe(
        firstDuplicateNaive(input, counter()),
      );
    }
  });
});

describe("operation counts — the optimized path does far fewer ops", () => {
  it("counts each comparison (naive) vs each element (fast) on a fixed input", () => {
    // [10,20,30,40,10]: naive scans 0+1+2+3 then matches on the 1st compare of the last = 7.
    const naive = counter();
    firstDuplicateNaive([10, 20, 30, 40, 10], naive);
    expect(naive.ops).toBe(7);
    // fast touches each of the 5 elements exactly once, stopping on the repeat = 5.
    const fast = counter();
    firstDuplicateFast([10, 20, 30, 40, 10], fast);
    expect(fast.ops).toBe(5);
  });

  it("naive grows quadratically while fast stays linear on the worst case", () => {
    const k = 6;
    const input = worstCaseInput(k); // k distinct then a repeat of the first → length k+1
    const naive = counter();
    const fast = counter();
    firstDuplicateNaive(input, naive);
    firstDuplicateFast(input, fast);

    // Closed-form expectations, derived by hand (not via the code under test):
    //   naive = (k-1)*k/2 full scans + 1 final match ; fast = k+1 elements touched.
    expect(naive.ops).toBe(((k - 1) * k) / 2 + 1); // 16
    expect(fast.ops).toBe(k + 1); // 7
    expect(naive.ops).toBeGreaterThan(fast.ops * 2);
  });
});
