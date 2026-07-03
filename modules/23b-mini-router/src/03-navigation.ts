import type { Route } from "./01-route-table.js";

/**
 * A tiny client router over the History API. `navigate(pathname)` matches the table, pushes a history
 * entry, and calls the injected `render` with `{ page, layoutChain, params }` (layoutChain root→leaf =
 * outermost-first). A `popstate` (Back/Forward) re-reads the location and re-renders the previous match.
 *
 * YOUR TURN — implement `createRouter`:
 *   - resolve `history` (default `window.history`) and `getLocation` (default `() => window.location.pathname`).
 *   - `navigate(pathname)`: `history.pushState(null, "", pathname)`, then match + render that path.
 *   - render only on a match: build `{ page: route.pagePath, layoutChain, params }`, remember it as the
 *     current state, and call `render(args)`; on no match, current becomes `null` and render is skipped.
 *   - add a `popstate` listener that renders `getLocation()`; `destroy()` must remove it (no leak).
 *   - `current()` returns the last rendered `{ pathname, page, layoutChain, params }` or `null`.
 */

export interface RenderArgs {
  page: string;
  layoutChain: string[];
  params: Record<string, string>;
}

export interface CurrentState extends RenderArgs {
  pathname: string;
}

export interface HistoryLike {
  pushState: (data: unknown, unused: string, url?: string | null) => void;
  back: () => void;
}

export interface RouterOptions {
  render: (args: RenderArgs) => void;
  history?: HistoryLike;
  getLocation?: () => string;
}

export interface Router {
  navigate: (pathname: string) => void;
  current: () => CurrentState | null;
  destroy: () => void;
}

export function createRouter(_table: Route[], _options: RouterOptions): Router {
  throw new Error(
    "TODO: wire navigate/popstate over the History API and expose current()",
  );
}
