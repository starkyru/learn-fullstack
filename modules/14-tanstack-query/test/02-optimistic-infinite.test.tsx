import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HttpResponse, delay, http } from "msw";
import { setupServer } from "msw/node";
import type { ReactElement } from "react";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import {
  API,
  useCards,
  useInfiniteActivity,
  useMoveCard,
} from "../solution/02-optimistic-infinite.js";
import type { Card } from "../solution/02-optimistic-infinite.js";

// Server maps the client-facing column "in-progress" onto its canonical "doing", so the optimistic
// value and the reconciled value are different strings.
const COLUMN_ALIAS: Record<string, string> = { "in-progress": "doing" };

let cards: Card[] = [];
let failMove = false;
// When a move fails, we also make the *post-settle refetch* of GET /cards fail. That way the
// invalidate→refetch in `onSettled` cannot supply a fresh "todo" from the server, so the ONLY way
// the card can end back on "todo" is the `onError` snapshot restore. This isolates the rollback:
// a no-op `onError` leaves the optimistic "in-progress" in the cache and the failed refetch keeps
// it (React Query retains the last data on a background refetch error), so the test fails.
let failCardsRefetch = false;

const activityPages: Record<
  number,
  { items: { id: string; text: string }[]; nextCursor: number | null }
> = {
  0: {
    items: [
      { id: "a1", text: "created board" },
      { id: "a2", text: "added card" },
    ],
    nextCursor: 1,
  },
  1: {
    items: [
      { id: "a3", text: "moved card" },
      { id: "a4", text: "renamed card" },
    ],
    nextCursor: null,
  },
};

const server = setupServer();
beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
beforeEach(() => {
  cards = [
    { id: "a", title: "Alpha", columnId: "todo" },
    { id: "b", title: "Beta", columnId: "todo" },
  ];
  failMove = false;
  failCardsRefetch = false;
  server.use(
    http.get(`${API}/cards`, () => {
      // The initial mount load happens before any move, so the flag is still false and it
      // succeeds (the card renders its real "todo"). Only the onSettled refetch after a failed
      // move is rejected, which is what removes the server as a possible source of the final "todo".
      if (failCardsRefetch) return new HttpResponse(null, { status: 500 });
      return HttpResponse.json(cards);
    }),
    http.post(`${API}/cards/:id/move`, async ({ params, request }) => {
      await delay(40); // hold the write so the optimistic patch is observable first
      if (failMove) {
        failCardsRefetch = true;
        return new HttpResponse(null, { status: 500 });
      }
      const { toColumn } = (await request.json()) as { toColumn: string };
      const canonical = COLUMN_ALIAS[toColumn] ?? toColumn;
      cards = cards.map((c) =>
        c.id === params["id"] ? { ...c, columnId: canonical } : c,
      );
      const moved = cards.find((c) => c.id === params["id"]);
      return HttpResponse.json(moved);
    }),
    http.get(`${API}/activity`, ({ request }) => {
      const cursor = Number(new URL(request.url).searchParams.get("cursor") ?? "0");
      return HttpResponse.json(activityPages[cursor]);
    }),
  );
});

function renderWithClient(ui: ReactElement): void {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
}

function MoveDemo(): ReactElement {
  const { data } = useCards();
  const move = useMoveCard();
  const card = (data ?? []).find((c) => c.id === "a");
  return (
    <div>
      <span data-testid="col">{card?.columnId ?? "…"}</span>
      <button
        type="button"
        onClick={() => move.mutate({ id: "a", toColumn: "in-progress" })}
      >
        Move
      </button>
    </div>
  );
}

describe("Task 2 — optimistic card move", () => {
  it("shows the optimistic column immediately, then reconciles to the server's canonical column", async () => {
    const user = userEvent.setup();
    renderWithClient(<MoveDemo />);

    // Wait for the initial query to settle so the card shows its real "todo" column
    // (findByTestId alone resolves against the always-present span while data is still loading).
    await screen.findByText("todo");
    expect(screen.getByTestId("col")).toHaveTextContent("todo");

    await user.click(screen.getByRole("button", { name: "Move" }));

    // Optimistic patch applied by onMutate before the (delayed) write resolves.
    // `findByText` matching an element whose exact text is "in-progress" IS the assertion that the
    // optimistic flash rendered. Do NOT re-read `.textContent` after the await: the span is a live
    // node a following re-render (reconcile to "doing", or the failure-path rollback to "todo") can
    // mutate in the microtask between the match and the read — that flaked on CI ("expected 'todo' to
    // be 'in-progress'").
    expect(await screen.findByText("in-progress")).toBeInTheDocument();
    // After settle → invalidate → refetch, the server's canonical "doing" replaces the guess.
    expect((await screen.findByText("doing")).textContent).toBe("doing");
  });

  it("rolls back to the exact previous column when the move fails (isolated from the refetch)", async () => {
    failMove = true;
    const user = userEvent.setup();
    renderWithClient(<MoveDemo />);

    // Wait for the initial query to settle so the card shows its real "todo" column
    // (findByTestId alone resolves against the always-present span while data is still loading).
    await screen.findByText("todo");
    expect(screen.getByTestId("col")).toHaveTextContent("todo");

    await user.click(screen.getByRole("button", { name: "Move" }));
    // Optimistic value flashes...
    // `findByText` matching an element whose exact text is "in-progress" IS the assertion that the
    // optimistic flash rendered. Do NOT re-read `.textContent` after the await: the span is a live
    // node a following re-render (reconcile to "doing", or the failure-path rollback to "todo") can
    // mutate in the microtask between the match and the read — that flaked on CI ("expected 'todo' to
    // be 'in-progress'").
    expect(await screen.findByText("in-progress")).toBeInTheDocument();

    // ...then the move rejects. Because `failCardsRefetch` makes the onSettled refetch fail too,
    // React Query keeps whatever is already in the cache. So the ONLY thing that can put "todo"
    // back is `onError` restoring the snapshot — a no-op onError would leave "in-progress" here.
    const rolledBack = await screen.findByText("todo");
    expect(rolledBack.textContent).toBe("todo");
    expect(screen.getByTestId("col")).toHaveTextContent("todo");

    // And it must NOT reconcile to the server's canonical column (the server never applied the
    // failed move), which also rules out the value leaking in via a successful refetch.
    expect(screen.queryByText("doing")).toBeNull();
  });
});

describe("Task 2 — infinite activity feed", () => {
  it("fetchNextPage appends the exact next page", async () => {
    function Feed(): ReactElement {
      const q = useInfiniteActivity();
      const items = (q.data?.pages ?? []).flatMap((p) => p.items);
      return (
        <div>
          <ul>
            {items.map((a) => (
              <li key={a.id}>{a.text}</li>
            ))}
          </ul>
          <button
            type="button"
            disabled={!q.hasNextPage}
            onClick={() => void q.fetchNextPage()}
          >
            More
          </button>
        </div>
      );
    }
    const user = userEvent.setup();
    renderWithClient(<Feed />);

    await screen.findByText("created board");
    expect(screen.getAllByRole("listitem").map((li) => li.textContent)).toEqual([
      "created board",
      "added card",
    ]);

    await user.click(screen.getByRole("button", { name: "More" }));

    await screen.findByText("renamed card");
    expect(screen.getAllByRole("listitem").map((li) => li.textContent)).toEqual([
      "created board",
      "added card",
      "moved card",
      "renamed card",
    ]);
    // last page had nextCursor null → no further pages
    expect(screen.getByRole("button", { name: "More" })).toBeDisabled();
  });
});
