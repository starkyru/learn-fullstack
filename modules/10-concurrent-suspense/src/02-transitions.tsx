import { useState, useTransition, type ChangeEvent } from "react";

/**
 * YOUR TURN — build a <FilterableCardList> whose input stays responsive while an
 * expensive result update runs at low priority. Hint-only:
 *
 * 1. Default the search to a local filter if none is passed:
 *    `const runSearch = search ?? (async (q) => cards.filter(c =>
 *    c.toLowerCase().includes(q.toLowerCase())))`.
 * 2. Hold `query` and `results` in `useState`; grab `[isPending, startTransition] =
 *    useTransition()`.
 * 3. In the input's `onChange`: update `query` URGENTLY (`setQuery(q)` — keeps the
 *    field snappy), then wrap the heavy part in a transition:
 *    `startTransition(async () => setResults(await runSearch(q)))`.
 * 4. Render a controlled `<input value={query}>` linked to a `<label htmlFor>` and a
 *    `<ul aria-busy={isPending} aria-label="cards">` of `<li key={c}>`. `isPending`
 *    stays true until the transition settles — surface it as the busy state.
 *
 * (Sibling tool: `useDeferredValue` defers a *value* you derive from, instead of
 * wrapping the *update* you trigger — reach for it when you can't wrap the setter.)
 */
export function FilterableCardList(_props: {
  cards: string[];
  search?: (query: string) => Promise<string[]>;
}) {
  void useState;
  void useTransition;
  throw new Error("TODO: async-search list kept responsive with useTransition");
}
