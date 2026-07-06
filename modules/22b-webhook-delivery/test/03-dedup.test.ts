import { describe, expect, it } from "vitest";
import { dedupe, orderPerEndpoint, type SeqEvent } from "../solution/03-dedup.js";

describe("dedupe", () => {
  it("drops duplicate ids within one batch, preserving input order", () => {
    const seen = new Set<string>();
    const out = dedupe([{ id: "a" }, { id: "a" }, { id: "b" }], seen);
    expect(out.map((e) => e.id)).toEqual(["a", "b"]);
  });

  it("drops redeliveries across batches via the persistent `seen` set", () => {
    const seen = new Set<string>();
    dedupe([{ id: "a" }, { id: "b" }], seen);
    const second = dedupe([{ id: "b" }, { id: "c" }], seen);
    expect(second.map((e) => e.id)).toEqual(["c"]);
    expect([...seen].sort()).toEqual(["a", "b", "c"]);
  });
});

describe("orderPerEndpoint", () => {
  it("sorts each endpoint's events by seq and reports no gaps when contiguous", () => {
    const events: SeqEvent[] = [
      { endpoint: "x", seq: 3 },
      { endpoint: "x", seq: 1 },
      { endpoint: "x", seq: 2 },
    ];
    const result = orderPerEndpoint(events);
    expect(result.get("x")!.ordered.map((e) => e.seq)).toEqual([1, 2, 3]);
    expect(result.get("x")!.gaps).toEqual([]);
  });

  it("reports missing sequence numbers as gaps", () => {
    const events: SeqEvent[] = [
      { endpoint: "y", seq: 1 },
      { endpoint: "y", seq: 5 },
      { endpoint: "y", seq: 3 },
    ];
    // Ordered seqs are 1,3,5 → 2 and 4 are missing.
    expect(orderPerEndpoint(events).get("y")!.gaps).toEqual([2, 4]);
  });

  it("keeps endpoints independent", () => {
    const events: SeqEvent[] = [
      { endpoint: "x", seq: 1 },
      { endpoint: "y", seq: 2 },
      { endpoint: "x", seq: 2 },
    ];
    const result = orderPerEndpoint(events);
    expect(result.get("x")!.ordered.map((e) => e.seq)).toEqual([1, 2]);
    expect(result.get("x")!.gaps).toEqual([]);
    // y saw only seq 2 → a single event, no interior gaps.
    expect(result.get("y")!.ordered.map((e) => e.seq)).toEqual([2]);
    expect(result.get("y")!.gaps).toEqual([]);
  });
});
