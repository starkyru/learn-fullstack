import { useRef, useSyncExternalStore } from "react";
import type { StoreApi } from "./01-create-store.js";

/**
 * The React binding. `useSyncExternalStore` only knows `Object.is`, so to honor a CUSTOM
 * `equalityFn` (and to keep an object selector from looping) we cache the last `{ state, selected }`
 * and decide in `getSnapshot` whether to return the cached reference or a fresh one:
 *
 *   - store state unchanged (same ref) → return the cached selected value (stable, no work).
 *   - state changed but the SELECTED slice is equal per `equalityFn` → return the cached value, so
 *     `useSyncExternalStore` sees `Object.is` equality and skips the re-render.
 *   - otherwise → compute, cache, and return the new value → component re-renders.
 *
 * Caching by state identity is also what stops an object-returning selector from tripping React's
 * "getSnapshot should be cached" infinite loop.
 */

export type EqualityFn<U> = (a: U, b: U) => boolean;

export function useStore<T extends object, U>(
  store: StoreApi<T>,
  selector: (state: T) => U,
  equalityFn: EqualityFn<U> = Object.is,
): U {
  const cache = useRef<{ state: T; selected: U } | undefined>(undefined);

  const getSnapshot = (): U => {
    const state = store.getState();
    const previous = cache.current;

    if (previous !== undefined && Object.is(previous.state, state)) {
      return previous.selected; // nothing changed at all
    }

    const selected = selector(state);
    if (previous !== undefined && equalityFn(previous.selected, selected)) {
      // Selected slice is equal — keep the OLD reference so React sees no change.
      cache.current = { state, selected: previous.selected };
      return previous.selected;
    }

    cache.current = { state, selected };
    return selected;
  };

  // `store.subscribe` takes a (state, prev) listener; useSyncExternalStore passes a 0-arg callback,
  // which our listener simply ignores. Same fn for server snapshot (tests/SSR).
  return useSyncExternalStore(store.subscribe, getSnapshot, getSnapshot);
}

/** Field-wise shallow equality — pass as `equalityFn` when a selector returns a fresh object. */
export function shallow<U>(a: U, b: U): boolean {
  if (Object.is(a, b)) return true;
  if (typeof a !== "object" || a === null || typeof b !== "object" || b === null) {
    return false;
  }
  const aKeys = Object.keys(a as Record<string, unknown>);
  const bKeys = Object.keys(b as Record<string, unknown>);
  if (aKeys.length !== bKeys.length) return false;
  return aKeys.every(
    (key) =>
      Object.prototype.hasOwnProperty.call(b, key) &&
      Object.is((a as Record<string, unknown>)[key], (b as Record<string, unknown>)[key]),
  );
}
