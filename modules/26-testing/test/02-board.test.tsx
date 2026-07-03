// @vitest-environment jsdom
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HttpResponse, http } from "msw";
import { setupServer } from "msw/node";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { Board } from "../solution/02-board.js";

const server = setupServer();
beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe("Task 2 — Board (RTL + MSW)", () => {
  it("renders exactly the cards the API returns, in order", async () => {
    server.use(
      http.get("http://api.test/cards", () =>
        HttpResponse.json([
          { id: "1", title: "Alpha" },
          { id: "2", title: "Beta" },
        ]),
      ),
    );

    render(<Board apiUrl="http://api.test" />);
    expect(screen.getByText("Loading…")).toBeInTheDocument();

    const items = await screen.findAllByRole("listitem");
    expect(items.map((li) => li.textContent)).toEqual(["Alpha", "Beta"]);
  });

  it("renders an empty list without any cards", async () => {
    server.use(http.get("http://api.test/cards", () => HttpResponse.json([])));

    render(<Board apiUrl="http://api.test" />);
    await waitFor(() => expect(screen.queryByText("Loading…")).not.toBeInTheDocument());
    expect(screen.queryAllByRole("listitem")).toHaveLength(0);
  });

  it("shows an alert with the status on a non-2xx response", async () => {
    server.use(
      http.get("http://api.test/cards", () => new HttpResponse(null, { status: 500 })),
    );

    render(<Board apiUrl="http://api.test" />);
    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("Error: HTTP 500");
  });

  // "Play"-style interaction: drive the UI like a user and assert the real POST round-trip.
  it("play: typing a title and clicking Add posts it and shows the new card", async () => {
    let posted: unknown = null;
    server.use(
      http.get("http://api.test/cards", () => HttpResponse.json([])),
      http.post("http://api.test/cards", async ({ request }) => {
        posted = await request.json();
        return HttpResponse.json(
          { id: "99", title: (posted as { title: string }).title },
          { status: 201 },
        );
      }),
    );

    const user = userEvent.setup();
    render(<Board apiUrl="http://api.test" />);
    await waitFor(() => expect(screen.queryByText("Loading…")).not.toBeInTheDocument());

    await user.type(screen.getByLabelText("New card title"), "Gamma");
    await user.click(screen.getByRole("button", { name: "Add" }));

    expect(await screen.findByText("Gamma")).toBeInTheDocument();
    expect(posted).toEqual({ title: "Gamma" });
    // input cleared after submit
    expect(screen.getByLabelText("New card title")).toHaveValue("");
  });
});
