import { QueryClient } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import type { ReactElement } from "react";
import { describe, expect, it, vi } from "vitest";
import {
  HydratedCards,
  cardsKey,
  hydrateCards,
  prefetchCards,
} from "../solution/03-ssr-hydration.js";
import type { Card } from "../solution/03-ssr-hydration.js";

const SEED: Card[] = [
  { id: "1", title: "Ship it" },
  { id: "2", title: "Then this" },
];

describe("Task 3 — dehydrate/hydrate cache round-trip", () => {
  it("survives prefetch → dehydrate → JSON → hydrate with the exact data under the same key", async () => {
    const fetchServer = vi.fn(async (): Promise<Card[]> => SEED);

    const wire = await prefetchCards(fetchServer);
    expect(fetchServer).toHaveBeenCalledTimes(1);
    // The wire is a plain JSON string (serializable) — proves dehydrate produced transferable state.
    expect(typeof wire).toBe("string");

    const client = hydrateCards(wire);
    expect(client.getQueryData<Card[]>(cardsKey)).toEqual(SEED);
  });
});

describe("Task 3 — render from the hydrated cache without a refetch flash", () => {
  it("shows the data on first render and never calls the client queryFn", async () => {
    const wire = await prefetchCards(async () => SEED);

    // If the component refetched, THIS spy would run. It must not.
    const clientQueryFn = vi.fn(async (): Promise<Card[]> => {
      throw new Error("client refetch should not happen — cache was hydrated");
    });
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });

    const ui: ReactElement = (
      <HydratedCards wire={wire} client={client} queryFn={clientQueryFn} />
    );
    render(ui);

    // Present synchronously on first render — no "loading" ever shown.
    expect(screen.queryByText("loading")).not.toBeInTheDocument();
    expect(screen.getAllByRole("listitem").map((li) => li.textContent)).toEqual([
      "Ship it",
      "Then this",
    ]);
    expect(clientQueryFn).not.toHaveBeenCalled();
  });
});
