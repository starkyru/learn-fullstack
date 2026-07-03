import { useCallback, useSyncExternalStore } from "react";

/**
 * `useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)` bridges React to state that
 * lives OUTSIDE it (window, media query, socket).
 *   - subscribe(onChange): wire the source's listener, RETURN a cleanup that removes it (else leak).
 *   - getSnapshot(): read the value synchronously; stable ref for equal values.
 *   - getServerSnapshot(): SSR value before hydration.
 *
 * YOUR TURN — implement subscribe + getSnapshot for both hooks.
 */

export function subscribeWindowWidth(_onChange: () => void): () => void {
  throw new Error("TODO: add a resize listener; return a remover");
}

export function getWindowWidth(): number {
  throw new Error("TODO: return window.innerWidth");
}

export function getServerWidth(): number {
  return 1024;
}

export function useWindowWidth(): number {
  return useSyncExternalStore(subscribeWindowWidth, getWindowWidth, getServerWidth);
}

export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (_onChange: () => void): (() => void) => {
      throw new Error("TODO: matchMedia(query), add 'change' listener, return remover");
    },
    [query],
  );
  const getSnapshot = useCallback((): boolean => {
    throw new Error("TODO: return window.matchMedia(query).matches");
  }, [query]);
  return useSyncExternalStore(subscribe, getSnapshot, () => false);
}
