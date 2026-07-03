/**
 * Task 2 — Component + MSW (TODO).
 *
 * Build a `Board` client component that, given `apiUrl`:
 *   - shows "Loading…" until the first fetch resolves,
 *   - `fetch(`${apiUrl}/cards`)`, renders one `<li>` per card (in order),
 *   - on a non-2xx response renders `<p role="alert">Error: HTTP {status}</p>`,
 *   - has a form: a labelled input "New card title" + an "Add" button that POSTs
 *     `{ title }` to `${apiUrl}/cards` and appends the returned card, clearing the input.
 *
 * The test does NOT mock `fetch` — it runs the component for real and intercepts the network with
 * MSW's `setupServer`. Keep the DOM roles/labels above so the queries find your elements. Tests
 * import from `solution/`; flip to `../src/...` to grade your own build.
 */
import type { ReactElement } from "react";

export interface BoardCard {
  id: string;
  title: string;
}

export interface BoardProps {
  apiUrl: string;
}

export function Board(_props: BoardProps): ReactElement {
  throw new Error(
    "TODO: fetch `${apiUrl}/cards`, render an <li> per card, and add a form that POSTs a new card",
  );
}
