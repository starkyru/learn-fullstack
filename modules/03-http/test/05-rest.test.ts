import { beforeEach, describe, expect, it } from "vitest";
import { createStore, restHandler, type ResourceStore } from "../solution/05-rest.js";

describe("restHandler", () => {
  let store: ResourceStore;
  beforeEach(() => {
    store = createStore();
  });

  it("POST creates a resource → 201 + Location + server-assigned id", () => {
    const res = restHandler(
      { method: "POST", path: "/widgets", body: { name: "a" } },
      store,
    );
    expect(res.status).toBe(201);
    expect(res.headers.Location).toBe("/widgets/1");
    expect(res.body).toEqual({ name: "a", id: "1" });
  });

  it("GET on the collection lists created resources without mutating (safe)", () => {
    restHandler({ method: "POST", path: "/widgets", body: { name: "a" } }, store);
    restHandler({ method: "POST", path: "/widgets", body: { name: "b" } }, store);
    const res = restHandler({ method: "GET", path: "/widgets" }, store);
    expect(res.status).toBe(200);
    expect(res.body).toEqual([
      { name: "a", id: "1" },
      { name: "b", id: "2" },
    ]);
    expect(store.items.size).toBe(2);
  });

  it("POST is NOT idempotent — two identical calls create two distinct ids", () => {
    const a = restHandler(
      { method: "POST", path: "/widgets", body: { name: "a" } },
      store,
    );
    const b = restHandler(
      { method: "POST", path: "/widgets", body: { name: "a" } },
      store,
    );
    expect(a.headers.Location).toBe("/widgets/1");
    expect(b.headers.Location).toBe("/widgets/2");
    expect(store.items.size).toBe(2);
  });

  it("GET a missing item → 404", () => {
    expect(restHandler({ method: "GET", path: "/widgets/99" }, store).status).toBe(404);
  });

  it("PUT creates when absent (201 + Location), replaces when present (200), idempotently", () => {
    const created = restHandler(
      { method: "PUT", path: "/widgets/7", body: { name: "x" } },
      store,
    );
    expect(created.status).toBe(201);
    expect(created.headers.Location).toBe("/widgets/7");
    expect(created.body).toEqual({ name: "x", id: "7" });

    const replaced = restHandler(
      { method: "PUT", path: "/widgets/7", body: { name: "y" } },
      store,
    );
    expect(replaced.status).toBe(200);
    expect(replaced.body).toEqual({ name: "y", id: "7" });

    // Idempotent: repeating the same PUT yields the same final state.
    const again = restHandler(
      { method: "PUT", path: "/widgets/7", body: { name: "y" } },
      store,
    );
    expect(again.status).toBe(200);
    expect(store.items.get("7")).toEqual({ name: "y", id: "7" });
    expect(store.items.size).toBe(1);
  });

  it("DELETE → 204 first, 404 second; the resource is absent either way (idempotent state)", () => {
    restHandler({ method: "PUT", path: "/widgets/3", body: { name: "z" } }, store);
    expect(restHandler({ method: "DELETE", path: "/widgets/3" }, store).status).toBe(204);
    expect(restHandler({ method: "DELETE", path: "/widgets/3" }, store).status).toBe(404);
    expect(store.items.has("3")).toBe(false);
  });

  it("an unsupported method → 405 with the right Allow header per endpoint kind", () => {
    const coll = restHandler({ method: "PATCH", path: "/widgets" }, store);
    expect(coll.status).toBe(405);
    expect(coll.headers.Allow).toBe("GET, POST");

    const item = restHandler({ method: "PATCH", path: "/widgets/1" }, store);
    expect(item.status).toBe(405);
    expect(item.headers.Allow).toBe("GET, PUT, DELETE");
  });
});
