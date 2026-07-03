import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import {
  type CardDto,
  cardsQueryOptions,
  fetchCards,
  makeClient,
} from "../solution/05-graphql-request.js";

const URL = "http://localhost/graphql";
const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

const CARDS: CardDto[] = [
  { __typename: "Card", id: "c1", title: "Alpha", listId: "l1" },
  { __typename: "Card", id: "c2", title: "Beta", listId: "l2" },
];

describe("Task 5 — graphql-request client", () => {
  it("fetchCards returns the exact cards over the injected fetch", async () => {
    server.use(http.post(URL, () => HttpResponse.json({ data: { cards: CARDS } })));
    const client = makeClient(URL, (...args) => fetch(...args));
    expect(await fetchCards(client)).toEqual(CARDS);
  });

  it("posts the Cards query document to the endpoint", async () => {
    let sentQuery = "";
    server.use(
      http.post(URL, async ({ request }) => {
        const body = (await request.json()) as { query: string };
        sentQuery = body.query;
        return HttpResponse.json({ data: { cards: CARDS } });
      }),
    );
    const client = makeClient(URL, (...args) => fetch(...args));
    await fetchCards(client);
    expect(sentQuery).toContain("query Cards");
    expect(sentQuery).toContain("__typename");
  });

  it("cardsQueryOptions exposes a TanStack-style queryKey + queryFn", async () => {
    server.use(http.post(URL, () => HttpResponse.json({ data: { cards: CARDS } })));
    const client = makeClient(URL, (...args) => fetch(...args));
    const options = cardsQueryOptions(client);
    expect(options.queryKey).toEqual(["cards"]);
    expect(await options.queryFn()).toEqual(CARDS);
  });

  it("propagates GraphQL errors from the response", async () => {
    server.use(
      http.post(URL, () =>
        HttpResponse.json({ errors: [{ message: "boom" }] }, { status: 200 }),
      ),
    );
    const client = makeClient(URL, (...args) => fetch(...args));
    await expect(fetchCards(client)).rejects.toThrow(/boom/);
  });
});
