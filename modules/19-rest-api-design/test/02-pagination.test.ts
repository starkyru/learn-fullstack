import { describe, it, expect } from "vitest";
import request from "supertest";
import { createApi, type Card } from "../solution/02-pagination.js";

// Injected id generator so inserted rows are predictable ("ins_1", "ins_2", ...).
function makeApp() {
  let n = 0;
  return createApi({ generateId: () => `ins_${++n}` });
}

const ids = (res: { body: { data: Card[] } }) => res.body.data.map((c) => c.id);

// Default seed on board b1 (createdAt order == c1..c5; title order differs):
//   c1 Delta/todo, c2 Alpha/done, c3 Echo/todo, c4 Bravo/done, c5 Charlie/todo

describe("cursor pagination + filter/sort", () => {
  it("walks the full collection in stable pages with no overlap", async () => {
    const app = makeApp();
    const p1 = await request(app).get("/v1/boards/b1/cards?limit=2");
    expect(p1.status).toBe(200);
    expect(ids(p1)).toEqual(["c1", "c2"]);
    expect(typeof p1.body.nextCursor).toBe("string");

    const p2 = await request(app).get(
      `/v1/boards/b1/cards?limit=2&cursor=${encodeURIComponent(p1.body.nextCursor)}`,
    );
    expect(ids(p2)).toEqual(["c3", "c4"]);

    const p3 = await request(app).get(
      `/v1/boards/b1/cards?limit=2&cursor=${encodeURIComponent(p2.body.nextCursor)}`,
    );
    expect(ids(p3)).toEqual(["c5"]);
    expect(p3.body.nextCursor).toBeNull();
  });

  it("is stable under an insert BEFORE the cursor position (no skip, no dupe)", async () => {
    const app = makeApp();

    const p1 = await request(app).get("/v1/boards/b1/cards?limit=2");
    expect(ids(p1)).toEqual(["c1", "c2"]);
    const cursor: string = p1.body.nextCursor;

    // Insert a card whose createdAt sorts BEFORE the whole first page.
    const inserted = await request(app).post("/v1/boards/b1/cards").send({
      title: "Backdated",
      status: "todo",
      createdAt: "2020-01-01T00:00:00.500Z",
    });
    expect(inserted.status).toBe(201);
    expect(inserted.body.id).toBe("ins_1");

    // Page 2 keyed off page 1's cursor is unaffected: exactly the next rows, no ins_1, no repeat.
    const p2 = await request(app).get(
      `/v1/boards/b1/cards?limit=2&cursor=${encodeURIComponent(cursor)}`,
    );
    expect(ids(p2)).toEqual(["c3", "c4"]);
    expect(ids(p2)).not.toContain("ins_1");

    // Re-reading from the start now shows the backdated row first — proving it really is in-store
    // and inserted before the cursor, yet it never leaked into the already-paged results.
    const fresh = await request(app).get("/v1/boards/b1/cards?limit=2");
    expect(ids(fresh)).toEqual(["ins_1", "c1"]);
  });

  it("filters by status", async () => {
    const res = await request(makeApp()).get("/v1/boards/b1/cards?status=done&limit=50");
    expect(res.status).toBe(200);
    expect(ids(res)).toEqual(["c2", "c4"]);
    expect(res.body.nextCursor).toBeNull();
  });

  it("sorts ascending by title", async () => {
    const res = await request(makeApp()).get("/v1/boards/b1/cards?sort=title&limit=50");
    // Alpha(c2) Bravo(c4) Charlie(c5) Delta(c1) Echo(c3)
    expect(ids(res)).toEqual(["c2", "c4", "c5", "c1", "c3"]);
  });

  it("sorts descending by createdAt", async () => {
    const res = await request(makeApp()).get(
      "/v1/boards/b1/cards?sort=-createdAt&limit=50",
    );
    expect(ids(res)).toEqual(["c5", "c4", "c3", "c2", "c1"]);
  });

  it("POST with an empty title returns a 400 problem+json with the mapped zod issue", async () => {
    const res = await request(makeApp()).post("/v1/boards/b1/cards").send({ title: "" });
    expect(res.status).toBe(400);
    expect(res.headers["content-type"]).toMatch(/application\/problem\+json/);
    expect(res.body).toEqual({
      type: "about:blank",
      title: "Invalid Card",
      status: 400,
      detail: "title: String must contain at least 1 character(s)",
      instance: "/v1/boards/b1/cards",
    });
  });

  it("keeps a STABLE total order (sortValue, id) when sort keys tie on createdAt", async () => {
    // c1 and c2 share createdAt; inserted c2-before-c1 so a missing id tie-break would
    // leave them in insertion order (c2, c1) instead of the id-ascending (c1, c2).
    const app = createApi({
      boards: ["b1"],
      cards: [
        {
          id: "c3",
          boardId: "b1",
          title: "Three",
          status: "todo",
          createdAt: "2020-02-01T00:00:01.000Z",
        },
        {
          id: "c2",
          boardId: "b1",
          title: "Two",
          status: "todo",
          createdAt: "2020-02-01T00:00:02.000Z",
        },
        {
          id: "c1",
          boardId: "b1",
          title: "One",
          status: "todo",
          createdAt: "2020-02-01T00:00:02.000Z",
        },
        {
          id: "c4",
          boardId: "b1",
          title: "Four",
          status: "todo",
          createdAt: "2020-02-01T00:00:03.000Z",
        },
      ],
    });

    const p1 = await request(app).get("/v1/boards/b1/cards?limit=2");
    expect(p1.status).toBe(200);
    expect(ids(p1)).toEqual(["c3", "c1"]);
    expect(typeof p1.body.nextCursor).toBe("string");

    const p2 = await request(app).get(
      `/v1/boards/b1/cards?limit=2&cursor=${encodeURIComponent(p1.body.nextCursor)}`,
    );
    expect(ids(p2)).toEqual(["c2", "c4"]);
    expect(p2.body.nextCursor).toBeNull();

    // Full walk is a stable, non-overlapping (sortValue, id) total order.
    expect([...ids(p1), ...ids(p2)]).toEqual(["c3", "c1", "c2", "c4"]);
  });

  it("clamps limit above MAX_LIMIT (100) to exactly MAX_LIMIT", async () => {
    const seed: Card[] = Array.from({ length: 120 }, (_, i) => ({
      id: `k${String(i).padStart(3, "0")}`,
      boardId: "b1",
      title: `Card ${i}`,
      status: "todo" as const,
      createdAt: `2020-03-01T00:${String(Math.floor(i / 60)).padStart(2, "0")}:${String(i % 60).padStart(2, "0")}.000Z`,
    }));
    const app = createApi({ boards: ["b1"], cards: seed });

    const res = await request(app).get("/v1/boards/b1/cards?limit=1000");
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(100);
    expect(typeof res.body.nextCursor).toBe("string");
  });

  it("falls back to the default limit (20) for a non-numeric limit", async () => {
    const seed: Card[] = Array.from({ length: 30 }, (_, i) => ({
      id: `d${String(i).padStart(2, "0")}`,
      boardId: "b1",
      title: `Card ${i}`,
      status: "todo" as const,
      createdAt: `2020-04-01T00:00:${String(i).padStart(2, "0")}.000Z`,
    }));
    const app = createApi({ boards: ["b1"], cards: seed });

    const res = await request(app).get("/v1/boards/b1/cards?limit=abc");
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(20);
  });

  it("404s an unknown board with problem+json", async () => {
    const res = await request(makeApp()).get("/v1/boards/nope/cards");
    expect(res.status).toBe(404);
    expect(res.headers["content-type"]).toMatch(/application\/problem\+json/);
    expect(res.body.title).toBe("Board Not Found");
  });

  it("GET one card returns 404 problem+json for a missing card", async () => {
    const res = await request(makeApp()).get("/v1/boards/b1/cards/missing");
    expect(res.status).toBe(404);
    expect(res.body.title).toBe("Card Not Found");
    expect(res.body.status).toBe(404);
  });
});
