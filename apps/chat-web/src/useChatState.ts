import { useSyncExternalStore } from "react";
import type { ChatStore, RootState } from "./chatSlice.js";

/**
 * Subscribe a component to a slice of Redux state without react-redux: `useSyncExternalStore` over
 * the store's own `subscribe`/`getState`. `selector` MUST return a stable reference for unchanged
 * state (use the memoized `selectVisibleMessages`, or a plain field read) so React's cache guard
 * is satisfied.
 */
export function useChatState<T>(store: ChatStore, selector: (state: RootState) => T): T {
  return useSyncExternalStore(
    store.subscribe,
    () => selector(store.getState()),
    () => selector(store.getState()),
  );
}
