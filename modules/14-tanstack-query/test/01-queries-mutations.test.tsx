import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HttpResponse, http } from "msw";
import { setupServer } from "msw/node";
import type { ReactElement } from "react";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { API, useAddCard, useCards, useLists } from "../solution/01-queries-mutations.js";
import type { Card, List } from "../solution/01-queries-mutations.js";

// The network is the real boundary → MSW. A tiny mutable server DB so a POST is visible on the
// next GET (that is what makes "invalidate refetches" observable).
let cards: Card[] = [];
const lists: List[] = [
  { id: "l1", name: "Backlog" },
  { id: "l2", name: "Doing" },
];

const server = setupServer();
beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
beforeEach(() => {
  cards = [{ id: "1", title: "Ship it" }];
  server.use(
    http.get(`${API}/cards`, () => HttpResponse.json(cards)),
    http.get(`${API}/lists`, () => HttpResponse.json(lists)),
    http.post(`${API}/cards`, async ({ request }) => {
      const { title } = (await request.json()) as { title: string };
      const created: Card = { id: `srv-${cards.length + 1}`, title };
      cards = [...cards, created];
      return HttpResponse.json(created, { status: 201 });
    }),
  );
});

function makeClient(): QueryClient {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } });
}

function renderWithClient(ui: ReactElement): void {
  render(<QueryClientProvider client={makeClient()}>{ui}</QueryClientProvider>);
}

describe("Task 1 — useCards / useLists queries", () => {
  it("renders exactly the cards the API returns", async () => {
    function Cards(): ReactElement {
      const { data, isPending } = useCards();
      if (isPending) return <p>loading</p>;
      return (
        <ul>
          {(data ?? []).map((c) => (
            <li key={c.id}>{c.title}</li>
          ))}
        </ul>
      );
    }
    renderWithClient(<Cards />);

    const first = await screen.findByRole("listitem");
    expect(first).toHaveTextContent("Ship it");
    expect(screen.getAllByRole("listitem")).toHaveLength(1);
  });

  it("useLists mirrors useCards and renders the list names in order", async () => {
    function Lists(): ReactElement {
      const { data } = useLists();
      return (
        <ul>
          {(data ?? []).map((l) => (
            <li key={l.id}>{l.name}</li>
          ))}
        </ul>
      );
    }
    renderWithClient(<Lists />);

    const items = await screen.findAllByRole("listitem");
    expect(items.map((li) => li.textContent)).toEqual(["Backlog", "Doing"]);
  });
});

describe("Task 1 — useAddCard mutation invalidates the cards query", () => {
  it("after the mutation the list refetches and shows the new server card", async () => {
    function Board(): ReactElement {
      const { data } = useCards();
      const add = useAddCard();
      return (
        <div>
          <ul>
            {(data ?? []).map((c) => (
              <li key={c.id}>{`${c.id}:${c.title}`}</li>
            ))}
          </ul>
          <button type="button" onClick={() => add.mutate("Review")}>
            Add
          </button>
        </div>
      );
    }
    const user = userEvent.setup();
    renderWithClient(<Board />);

    await screen.findByText("1:Ship it");
    await user.click(screen.getByRole("button", { name: "Add" }));

    // The refetch (triggered by invalidateQueries) brings back the SERVER's card id "srv-2", not a
    // client-guessed one. Asserting the server id proves a real refetch happened.
    await waitFor(() =>
      expect(screen.getAllByRole("listitem").map((li) => li.textContent)).toEqual([
        "1:Ship it",
        "srv-2:Review",
      ]),
    );
  });
});
