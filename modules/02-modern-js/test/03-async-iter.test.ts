import { describe, expect, it } from "vitest";
import { paginate, type Page } from "../solution/03-async-iter.js";

describe("paginate", () => {
  it("yields every item across pages in order", async () => {
    const pages: Record<string, Page<number>> = {
      start: { items: [1, 2], next: "p2" },
      p2: { items: [3, 4], next: "p3" },
      p3: { items: [5] },
    };
    const fetchPage = async (cursor?: string) => pages[cursor ?? "start"]!;
    const collected: number[] = [];
    for await (const n of paginate(fetchPage)) collected.push(n);
    expect(collected).toEqual([1, 2, 3, 4, 5]);
  });
});
