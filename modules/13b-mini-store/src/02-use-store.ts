import { useSyncExternalStore } from "react";
import type { StoreApi } from "./01-create-store.js";

/**
 * The React binding on `useSyncExternalStore`. To honor a custom `equalityFn` (and to keep an
 * object selector from looping), cache the last `{ state, selected }` and decide in getSnapshot
 * whether to return the cached reference or a fresh one.
 *
 * YOUR TURN — implement `useStore` and `shallow`:
 *   - getSnapshot: if state unchanged → cached selected; if selected equal per equalityFn → cached;
 *     else compute + cache + return.
 *   - wire it with useSyncExternalStore(store.subscribe, getSnapshot, getSnapshot).
 *   - shallow: field-wise equality for one level of object.
 */

export type EqualityFn<U> = (a: U, b: U) => boolean;

export function useStore<T extends object, U>(
  _store: StoreApi<T>,
  _selector: (state: T) => U,
  _equalityFn: EqualityFn<U> = Object.is,
): U {
  // Keep the hook call so the shape is right; replace the body with the cached-snapshot logic.
  useSyncExternalStore(
    () => () => {},
    (): U => {
      throw new Error("TODO: implement the cached getSnapshot");
    },
    (): U => {
      throw new Error("TODO: implement the cached getSnapshot");
    },
  );
  throw new Error("TODO: return the selected slice");
}

export function shallow<U>(_a: U, _b: U): boolean {
  throw new Error("TODO: field-wise shallow equality");
}
