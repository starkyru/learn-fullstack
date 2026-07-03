import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import type { Card } from "../solution/01-slices.js";
import { cardsApi, makeCardsStore, selectCards } from "../solution/03-rtk-query.js";

// A tiny mutable "server DB". The network is the real boundary → mock it with MSW, nothing else.
let db: Card[] = [];

const server = setupServer(
  http.get("http://localhost/api/cards", () => HttpResponse.json(db)),
  http.post("http://localhost/api/cards", async ({ request }) => {
    const { title } = (await request.json()) as { title: string };
    const created: Card = { id: `srv-${db.length + 1}`, title, columnId: "todo" };
    db = [...db, created];
    return HttpResponse.json(created);
  }),
);

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
beforeEach(() => {
  db = [{ id: "1", title: "Ship", columnId: "todo" }];
});

async function poll<T>(read: () => T, ok: (v: T) => boolean, tries = 100): Promise<T> {
  for (let i = 0; i < tries; i++) {
    const value = read();
    if (ok(value)) return value;
    await new Promise((r) => setTimeout(r, 10));
  }
  throw new Error("poll timed out");
}

const titles = (cards: Card[] | undefined) => (cards ?? []).map((c) => c.title);

describe("cardsApi — tag invalidation", () => {
  it("auto-refetches getCards after addCard invalidates the Cards tag", async () => {
    const store = makeCardsStore();
    const sub = store.dispatch(cardsApi.endpoints.getCards.initiate());
    await sub;
    expect(titles(selectCards(store))).toEqual(["Ship"]);

    await store.dispatch(cardsApi.endpoints.addCard.initiate({ title: "Review" }));

    // Wait for the SERVER's card (id "srv-2") — not the optimistic placeholder (id "optimistic"),
    // which onQueryStarted inserts regardless of invalidation. Asserting on the id is what makes
    // this test prove a real refetch occurred: removing `invalidatesTags` leaves the cache holding
    // only the "optimistic"-id card, so this poll would time out.
    const after = await poll(
      () => selectCards(store),
      (cards) => (cards ?? []).some((c) => c.id === "srv-2"),
    );
    expect(after?.map((c) => ({ id: c.id, title: c.title }))).toEqual([
      { id: "1", title: "Ship" },
      { id: "srv-2", title: "Review" },
    ]);
    sub.unsubscribe();
  });
});

describe("cardsApi — optimistic update", () => {
  it("shows the card immediately, then rolls back when the POST fails", async () => {
    server.use(
      http.post(
        "http://localhost/api/cards",
        () => new HttpResponse(null, { status: 500 }),
      ),
    );
    const store = makeCardsStore();
    const sub = store.dispatch(cardsApi.endpoints.getCards.initiate());
    await sub;
    expect(titles(selectCards(store))).toEqual(["Ship"]);

    const pending = store.dispatch(
      cardsApi.endpoints.addCard.initiate({ title: "Nope" }),
    );
    // Optimistic patch is applied synchronously during dispatch — visible before the POST fails.
    expect(titles(selectCards(store))).toEqual(["Ship", "Nope"]);

    await pending;
    // The 500 rejects queryFulfilled → patch.undo() restores the prior cache.
    const after = await poll(
      () => selectCards(store),
      (cards) => !titles(cards).includes("Nope"),
    );
    expect(titles(after)).toEqual(["Ship"]);
    sub.unsubscribe();
  });
});
