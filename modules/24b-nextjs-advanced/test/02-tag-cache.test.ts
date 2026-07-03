import { describe, expect, it } from "vitest";
import { createTagCache, type TagCache } from "../solution/02-tag-cache.js";

interface Card {
  id: string;
  title: string;
}

/** Three route caches sharing one registry: a list route + two detail routes. */
function seed(): TagCache<Card | Card[]> {
  const cache = createTagCache<Card | Card[]>();
  cache.set(
    "/cards",
    [
      { id: "42", title: "Ada" },
      { id: "7", title: "Alan" },
    ],
    ["cards:list"],
  );
  cache.set("/cards/42", { id: "42", title: "Ada" }, ["card:42", "cards:list"]);
  cache.set("/cards/7", { id: "7", title: "Alan" }, ["card:7", "cards:list"]);
  return cache;
}

describe("createTagCache", () => {
  it("get returns the stored value; a missing key is a miss", () => {
    const cache = seed();
    expect(cache.get("/cards/42")).toEqual({ id: "42", title: "Ada" });
    expect(cache.get("/cards/999")).toBeUndefined();
  });

  it("revalidating a scoped tag invalidates ONLY the tagged detail route", () => {
    const cache = seed();
    expect(cache.revalidateTag("card:42")).toEqual(["/cards/42"]);

    expect(cache.get("/cards/42")).toBeUndefined(); // stale → refetch
    expect(cache.get("/cards/7")).toEqual({ id: "7", title: "Alan" }); // untouched
    expect(cache.get("/cards")).toEqual([
      { id: "42", title: "Ada" },
      { id: "7", title: "Alan" },
    ]); // untouched
  });

  it("revalidating a shared tag invalidates every route carrying it", () => {
    const cache = seed();
    expect(cache.revalidateTag("cards:list")).toEqual([
      "/cards",
      "/cards/42",
      "/cards/7",
    ]);
    expect(cache.get("/cards")).toBeUndefined();
    expect(cache.get("/cards/42")).toBeUndefined();
    expect(cache.get("/cards/7")).toBeUndefined();
  });

  it("revalidating an unknown tag invalidates nothing", () => {
    const cache = seed();
    expect(cache.revalidateTag("card:999")).toEqual([]);
    expect(cache.keys()).toEqual(["/cards", "/cards/42", "/cards/7"]);
  });

  it("re-setting a stale key makes it fresh again and re-indexes its tags", () => {
    const cache = seed();
    cache.revalidateTag("card:42");
    expect(cache.peek("/cards/42")?.stale).toBe(true);

    // Re-set drops the old "cards:list" tag; the entry is now tagged only "card:42".
    cache.set("/cards/42", { id: "42", title: "Ada v2" }, ["card:42"]);
    expect(cache.get("/cards/42")).toEqual({ id: "42", title: "Ada v2" });

    // Revalidating the list no longer reaches /cards/42.
    expect(cache.revalidateTag("cards:list")).toEqual(["/cards", "/cards/7"]);
    expect(cache.get("/cards/42")).toEqual({ id: "42", title: "Ada v2" });
  });

  it("keys() and revalidateTag return keys lexicographically sorted, not in insertion order", () => {
    // Seed OUT of lexicographic order: /cards/7 is inserted BEFORE /cards/42, and /cards last.
    const cache = createTagCache<Card>();
    cache.set("/cards/7", { id: "7", title: "Alan" }, ["shared"]);
    cache.set("/cards/42", { id: "42", title: "Ada" }, ["shared"]);
    cache.set("/cards", { id: "0", title: "List" }, ["shared"]);

    // Insertion order is ["/cards/7", "/cards/42", "/cards"]; the contract demands sorted output.
    expect(cache.keys()).toEqual(["/cards", "/cards/42", "/cards/7"]);
    expect(cache.revalidateTag("shared")).toEqual(["/cards", "/cards/42", "/cards/7"]);
  });

  it("revalidateTag is idempotent: a second call finds nothing newly fresh→stale", () => {
    const cache = seed();
    expect(cache.revalidateTag("cards:list")).toEqual([
      "/cards",
      "/cards/42",
      "/cards/7",
    ]);
    // Everything carrying the tag is already stale — a repeat call invalidates nothing new.
    expect(cache.revalidateTag("cards:list")).toEqual([]);
  });

  it("peek exposes the raw entry (present but stale) after revalidation", () => {
    const cache = seed();
    cache.revalidateTag("card:7");
    const entry = cache.peek("/cards/7");
    expect(entry?.stale).toBe(true);
    expect(entry?.tags).toEqual(["card:7", "cards:list"]);
  });
});
