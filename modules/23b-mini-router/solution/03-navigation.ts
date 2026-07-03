import type { Route } from "./01-route-table.js";
import { matchRoute } from "./02-matcher.js";

/**
 * A tiny client router over the History API. `navigate(pathname)` matches the table, pushes a new
 * history entry, and calls the injected `render` with `{ page, layoutChain, params }` — `layoutChain`
 * is root→leaf, i.e. OUTERMOST-first, which is the order a real renderer would nest the layouts around
 * the page. A `popstate` (Back/Forward) re-derives the match from the current location and re-renders.
 *
 * Everything the router touches is injected so tests stay deterministic (no reliance on jsdom's async
 * history internals): `history` (default `window.history`) for `pushState`, and `getLocation` (default
 * `() => window.location.pathname`) for reading the current path on `popstate`. `destroy()` removes the
 * `popstate` listener so nothing leaks after the router is thrown away.
 */

export interface RenderArgs {
  page: string;
  layoutChain: string[];
  params: Record<string, string>;
}

export interface CurrentState extends RenderArgs {
  pathname: string;
}

/** The slice of the History API this router needs — `window.history` satisfies it structurally. */
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

export function createRouter(table: Route[], options: RouterOptions): Router {
  const { render } = options;
  const history = options.history ?? window.history;
  const getLocation = options.getLocation ?? (() => window.location.pathname);

  let currentState: CurrentState | null = null;

  const renderPath = (pathname: string): void => {
    const match = matchRoute(table, pathname);
    if (!match) {
      currentState = null;
      return;
    }
    const args: RenderArgs = {
      page: match.route.pagePath,
      layoutChain: match.layoutChain,
      params: match.params,
    };
    currentState = { pathname, ...args };
    render(args);
  };

  // Back/Forward: the browser has already updated the URL, so re-read it and re-render that match.
  const onPopState = (): void => {
    renderPath(getLocation());
  };
  window.addEventListener("popstate", onPopState);

  return {
    navigate: (pathname) => {
      history.pushState(null, "", pathname);
      renderPath(pathname);
    },
    current: () => currentState,
    destroy: () => {
      window.removeEventListener("popstate", onPopState);
    },
  };
}
