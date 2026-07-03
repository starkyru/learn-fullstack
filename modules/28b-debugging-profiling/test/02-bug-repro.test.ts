import { describe, expect, it } from "vitest";
import { arrayRepo, listHandler, paginate } from "../solution/02-bug-repro.js";

// 10 rows: "r0".."r9". Pages are 1-indexed with pageSize 3.
const rows = Array.from({ length: 10 }, (_, i) => `r${i}`);

describe("paginate — the off-by-one bug is pinned", () => {
  it("page 1 starts at offset 0 (the bug shifted this to r3..r5)", async () => {
    const result = await paginate(arrayRepo(rows), 1, 3);
    expect(result.items).toEqual(["r0", "r1", "r2"]);
  });

  it("page 2 is the next window, not the third", async () => {
    const result = await paginate(arrayRepo(rows), 2, 3);
    expect(result.items).toEqual(["r3", "r4", "r5"]);
  });

  it("reports total, totalPages and hasNext for a middle page", async () => {
    const result = await paginate(arrayRepo(rows), 2, 3);
    expect(result).toEqual({
      items: ["r3", "r4", "r5"],
      page: 2,
      pageSize: 3,
      total: 10,
      totalPages: 4, // ceil(10 / 3)
      hasNext: true,
    });
  });

  it("the last page is short and has no next", async () => {
    const result = await paginate(arrayRepo(rows), 4, 3);
    expect(result.items).toEqual(["r9"]);
    expect(result.hasNext).toBe(false);
  });
});

describe("listHandler — HTTP layer parses the query and delegates", () => {
  it("defaults to page 1 / pageSize 10 when the query is empty", async () => {
    const result = await listHandler({}, arrayRepo(rows));
    expect(result.page).toBe(1);
    expect(result.pageSize).toBe(10);
    expect(result.items).toEqual(rows); // all 10 fit on page 1
  });

  it("parses string query params into the correct page window", async () => {
    const result = await listHandler({ page: "3", pageSize: "3" }, arrayRepo(rows));
    expect(result.items).toEqual(["r6", "r7", "r8"]);
    expect(result.page).toBe(3);
  });
});
