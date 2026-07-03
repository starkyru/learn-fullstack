// @vitest-environment jsdom
import { act, render, renderHook, screen, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import {
  type CardEntity,
  GraphQLClient,
  NormalizedCache,
  seqIdSource,
  useAddCardMutation,
  useCardsQuery,
} from "../solution/04-client.js";

const URL = "http://localhost/graphql";
const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

const makeClient = () => new GraphQLClient(URL, (...args) => fetch(...args));

describe("Task 4 — typed client, normalized cache, optimistic updates", () => {
  it("useCardsQuery fetches, normalizes by __typename:id, and renders the cards", async () => {
    server.use(
      http.post(URL, () =>
        HttpResponse.json({
          data: {
            cards: [
              { __typename: "Card", id: "c1", title: "Alpha", listId: "l1" },
              { __typename: "Card", id: "c2", title: "Beta", listId: "l2" },
            ],
          },
        }),
      ),
    );
    const client = makeClient();
    const cache = new NormalizedCache();

    function CardsList() {
      const { cards, loading } = useCardsQuery(client, cache);
      if (loading) return <p>loading</p>;
      return (
        <ul>
          {cards.map((c) => (
            <li key={c.id}>{c.title}</li>
          ))}
        </ul>
      );
    }

    render(<CardsList />);
    expect(await screen.findByText("Alpha")).toBeInTheDocument();
    expect(screen.getByText("Beta")).toBeInTheDocument();
    expect(cache.read("Card:c1")).toEqual({
      __typename: "Card",
      id: "c1",
      title: "Alpha",
      listId: "l1",
    });
  });

  it("useAddCardMutation writes an optimistic entry immediately, then reconciles on resolve", async () => {
    let release: () => void = () => {};
    const gate = new Promise<void>((r) => {
      release = r;
    });
    server.use(
      http.post(URL, async ({ request }) => {
        const body = (await request.json()) as {
          query: string;
          variables?: Record<string, string>;
        };
        if (body.query.includes("AddCard")) {
          await gate; // hold the server response open to observe the optimistic state
          return HttpResponse.json({
            data: {
              addCard: {
                __typename: "Card",
                id: "c99",
                title: body.variables?.title,
                listId: body.variables?.listId,
              },
            },
          });
        }
        return HttpResponse.json({ data: { cards: [] } });
      }),
    );
    const client = makeClient();
    const cache = new NormalizedCache();
    const ids = seqIdSource("tmp-");

    const { result } = renderHook(() => useAddCardMutation(client, cache, ids));

    let pending!: Promise<CardEntity>;
    act(() => {
      pending = result.current.mutate({ title: "New", listId: "l1" });
    });

    // Optimistic entry is in the cache BEFORE the server has responded.
    expect(cache.read("Card:tmp-1")).toEqual({
      __typename: "Card",
      id: "tmp-1",
      title: "New",
      listId: "l1",
    });
    expect(cache.read("Card:c99")).toBeUndefined();

    release();
    await act(async () => {
      await pending;
    });

    // Reconciled: the temp entry is gone, the server's real card is present.
    expect(cache.read("Card:tmp-1")).toBeUndefined();
    expect(cache.read("Card:c99")).toEqual({
      __typename: "Card",
      id: "c99",
      title: "New",
      listId: "l1",
    });
  });

  it("shows the optimistic card in the rendered list before the server confirms it", async () => {
    let release: () => void = () => {};
    const gate = new Promise<void>((r) => {
      release = r;
    });
    server.use(
      http.post(URL, async ({ request }) => {
        const body = (await request.json()) as {
          query: string;
          variables?: Record<string, string>;
        };
        if (body.query.includes("AddCard")) {
          await gate;
          return HttpResponse.json({
            data: {
              addCard: {
                __typename: "Card",
                id: "c99",
                title: body.variables?.title,
                listId: body.variables?.listId,
              },
            },
          });
        }
        return HttpResponse.json({ data: { cards: [] } });
      }),
    );
    const client = makeClient();
    const cache = new NormalizedCache();
    const ids = seqIdSource("tmp-");

    function Board() {
      const { cards } = useCardsQuery(client, cache);
      const { mutate } = useAddCardMutation(client, cache, ids);
      return (
        <div>
          <button onClick={() => void mutate({ title: "New", listId: "l1" })}>add</button>
          <ul>
            {cards.map((c) => (
              <li key={c.id} data-testid={`card-${c.id}`}>
                {c.title}
              </li>
            ))}
          </ul>
        </div>
      );
    }

    render(<Board />);
    await waitFor(() => expect(cache.getSnapshot()).toBeGreaterThan(0)); // initial query settled

    await act(async () => {
      screen.getByText("add").click();
    });
    expect(screen.getByTestId("card-tmp-1")).toHaveTextContent("New");

    await act(async () => {
      release();
    });
    await waitFor(() => expect(screen.getByTestId("card-c99")).toHaveTextContent("New"));
    expect(screen.queryByTestId("card-tmp-1")).toBeNull();
  });

  it("rolls back the optimistic entry when the mutation errors (and it EXISTED before the error)", async () => {
    // Hold the error response open so we can observe the optimistic entry while the request is
    // in-flight, proving rollback removes something that was actually written first.
    let release: () => void = () => {};
    const gate = new Promise<void>((r) => {
      release = r;
    });
    server.use(
      http.post(URL, async ({ request }) => {
        const body = (await request.json()) as { query: string };
        if (body.query.includes("AddCard")) {
          await gate;
          return HttpResponse.json({ errors: [{ message: "nope" }] });
        }
        return HttpResponse.json({ data: { cards: [] } });
      }),
    );
    const client = makeClient();
    const cache = new NormalizedCache();
    const ids = seqIdSource("tmp-");

    const { result } = renderHook(() => useAddCardMutation(client, cache, ids));

    let pending!: Promise<CardEntity>;
    act(() => {
      pending = result.current.mutate({ title: "Boom", listId: "l1" });
    });

    // BEFORE the rejection settles: the optimistic entry is present. A mutation that throws before
    // the optimistic write (or never writes) would fail this assertion.
    expect(cache.read("Card:tmp-1")).toEqual({
      __typename: "Card",
      id: "tmp-1",
      title: "Boom",
      listId: "l1",
    });

    // Await the mutation's rejection INSIDE `act`, so its catch-block rollback fully settles
    // before we assert removal.
    release();
    await act(async () => {
      await expect(pending).rejects.toThrow("nope");
    });

    // AFTER rollback: the optimistic entry is gone.
    expect(cache.read("Card:tmp-1")).toBeUndefined();
  });
});
