import { useState, useTransition, type ChangeEvent } from "react";

/**
 * Keep the input responsive while an expensive result update runs at low priority.
 * The keystroke updates `query` urgently (the field never lags), while the heavier
 * search runs inside `startTransition` — `isPending` is true until it settles, so the
 * UI can show a busy state instead of freezing. (`useDeferredValue` is the sibling
 * tool: defer a *value* you derive from, rather than wrap the *update* you trigger.)
 */
export function FilterableCardList({
  cards,
  search,
}: {
  cards: string[];
  search?: (query: string) => Promise<string[]>;
}) {
  const runSearch =
    search ??
    (async (q: string) => cards.filter((c) => c.toLowerCase().includes(q.toLowerCase())));

  const [query, setQuery] = useState("");
  const [results, setResults] = useState(cards);
  const [isPending, startTransition] = useTransition();

  function onChange(e: ChangeEvent<HTMLInputElement>) {
    const q = e.target.value;
    setQuery(q); // urgent: the input stays responsive
    startTransition(async () => {
      setResults(await runSearch(q)); // low priority: the heavy list update
    });
  }

  return (
    <div>
      <label htmlFor="card-filter">Filter</label>
      <input id="card-filter" value={query} onChange={onChange} />
      <ul aria-busy={isPending} aria-label="cards">
        {results.map((c) => (
          <li key={c}>{c}</li>
        ))}
      </ul>
    </div>
  );
}
