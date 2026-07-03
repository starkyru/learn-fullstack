import { useCallback, useSyncExternalStore } from "react";

/**
 * `useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)` is the React-blessed bridge to
 * any state that lives OUTSIDE React — `window`, a media query, a Zustand store, a WebSocket.
 *   - subscribe(onChange): wire the source's listener, RETURN a cleanup that removes it (or you leak
 *     a listener on every unmount).
 *   - getSnapshot(): read the current value synchronously. Must be referentially stable for equal
 *     values, or React loops (return the same object, not a fresh one, when nothing changed).
 *   - getServerSnapshot(): the SSR value, used before hydration where `window` does not exist.
 */

export function subscribeWindowWidth(onChange: () => void): () => void {
  window.addEventListener("resize", onChange);
  return () => window.removeEventListener("resize", onChange);
}

export function getWindowWidth(): number {
  return window.innerWidth;
}

/** SSR fallback — a sensible default width before hydration. */
export function getServerWidth(): number {
  return 1024;
}

export function useWindowWidth(): number {
  return useSyncExternalStore(subscribeWindowWidth, getWindowWidth, getServerWidth);
}

/**
 * Media-query bridge. `subscribe` is memoized on `query` so React keeps one subscription per query;
 * a fresh matchMedia listener would re-subscribe on every render otherwise.
 */
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const mql = window.matchMedia(query);
      mql.addEventListener("change", onChange);
      return () => mql.removeEventListener("change", onChange);
    },
    [query],
  );
  const getSnapshot = useCallback(() => window.matchMedia(query).matches, [query]);
  return useSyncExternalStore(subscribe, getSnapshot, () => false);
}
