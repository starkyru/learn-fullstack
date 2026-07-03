import type { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
  type MockInstance,
} from "vitest";
import {
  DataloaderModule,
  ListRepository,
  SimpleDataLoader,
} from "../solution/02-dataloader.js";

describe("Task 2 — DataLoader batching", () => {
  let app: INestApplication;
  let repo: ListRepository;
  let spy: MockInstance<ListRepository["fetchByIds"]>;

  beforeEach(async () => {
    const ref = await Test.createTestingModule({ imports: [DataloaderModule] }).compile();
    app = ref.createNestApplication();
    await app.init();
    repo = app.get(ListRepository);
    spy = vi.spyOn(repo, "fetchByIds");
  });

  afterEach(async () => {
    spy.mockRestore();
    await app.close();
  });

  const cardsWithList = () =>
    request(app.getHttpServer())
      .post("/graphql")
      .send({ query: `{ cards { id list { id title } } }` });

  it("collapses N card→list lookups into ONE batch call carrying every listId", async () => {
    const res = await cardsWithList();
    expect(res.body.errors).toBeUndefined();
    // Three cards, but the loader coalesces their list lookups into a single fetch.
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenNthCalledWith(1, ["l1", "l2", "l1"]);
  });

  it("still resolves each card's list correctly through the loader", async () => {
    const res = await cardsWithList();
    expect(res.body.data.cards).toEqual([
      { id: "c1", list: { id: "l1", title: "Todo" } },
      { id: "c2", list: { id: "l2", title: "Doing" } },
      { id: "c3", list: { id: "l1", title: "Todo" } },
    ]);
  });

  it("uses a FRESH per-request loader: a second request triggers its own single batch", async () => {
    await cardsWithList();
    await cardsWithList();
    expect(spy).toHaveBeenCalledTimes(2);
    expect(spy).toHaveBeenNthCalledWith(1, ["l1", "l2", "l1"]);
    expect(spy).toHaveBeenNthCalledWith(2, ["l1", "l2", "l1"]);
  });

  it("builds a DISTINCT SimpleDataLoader instance per request (no shared singleton)", async () => {
    // Capture the receiver (`this`) of every `.load` so we can see WHICH loader instance served
    // each request. A fresh-per-request context factory yields two different instances across two
    // requests; a hoisted shared loader would serve BOTH requests from one instance.
    const instances = new Set<SimpleDataLoader<string, unknown>>();
    const original = SimpleDataLoader.prototype.load;
    const loadSpy = vi
      .spyOn(SimpleDataLoader.prototype, "load")
      .mockImplementation(function (
        this: SimpleDataLoader<string, unknown>,
        key: unknown,
      ) {
        instances.add(this);
        return original.call(this, key);
      });
    try {
      await cardsWithList();
      const afterFirst = instances.size;
      await cardsWithList();

      // First request used exactly one loader instance; the second introduced a NEW one.
      expect(afterFirst).toBe(1);
      expect(instances.size).toBe(2);
    } finally {
      loadSpy.mockRestore();
    }
  });

  it("SimpleDataLoader coalesces same-tick loads into one ordered batchFn call", async () => {
    const batches: string[][] = [];
    const loader = new SimpleDataLoader<string, string>(async (keys) => {
      batches.push(keys);
      return keys.map((k) => k.toUpperCase());
    });

    const results = await Promise.all([
      loader.load("x"),
      loader.load("y"),
      loader.load("z"),
    ]);

    expect(batches).toEqual([["x", "y", "z"]]); // exactly one batch, in load order
    expect(results).toEqual(["X", "Y", "Z"]); // resolved positionally
  });
});
