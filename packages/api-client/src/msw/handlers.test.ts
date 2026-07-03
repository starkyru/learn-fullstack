import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { setupServer } from "msw/node";
import { handlers } from "./handlers.js";
import { apiFetch } from "../http.js";

const server = setupServer(...handlers);
beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

interface Card {
  id: string;
  title: string;
  listId: string;
}

describe("baseline MSW handlers", () => {
  it("serves the fake /api/cards list through apiFetch", async () => {
    const cards = await apiFetch<Card[]>("http://localhost/api/cards");
    expect(cards).toHaveLength(2);
    expect(cards[0]?.title).toBe("First card");
  });
});
