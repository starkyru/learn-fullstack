import { HttpResponse, http } from "msw";

/**
 * Baseline MSW handlers so frontend modules (e.g. TanStack Query in module 14) can run
 * against a fake API before a real server exists. Later modules extend these.
 */
// `*/api/...` matches any origin (the browser uses a relative base; node tests use an
// absolute URL), so the same handlers work in Storybook, the app, and unit tests.
export const handlers = [
  http.get("*/api/cards", () =>
    HttpResponse.json([
      { id: "c1", title: "First card", listId: "l1" },
      { id: "c2", title: "Second card", listId: "l1" },
    ]),
  ),
  http.get("*/api/lists", () => HttpResponse.json([{ id: "l1", name: "To do" }])),
];
