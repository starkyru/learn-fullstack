import type { SetState, StateCreator } from "./01-create-store.js";

/**
 * Middleware wraps a `StateCreator` and returns a new one, intercepting `set` (and, for persist,
 * the initial state). Compose like Zustand:
 *   createStore(persist(devtools(init, { logger }), { name, storage }))
 *
 * YOUR TURN — implement `persist` and `devtools`:
 *   - persist: wrap set to write JSON to storage after each change; rehydrate initial from storage
 *     (merge saved over defaults; ignore corrupt JSON).
 *   - devtools: wrap set to log the post-set state to the injected logger.
 */

export interface PersistStorage {
  getItem: (name: string) => string | null;
  setItem: (name: string, value: string) => void;
  removeItem: (name: string) => void;
}

export interface PersistOptions {
  name: string;
  storage: PersistStorage;
}

export function persist<T extends object>(
  _initializer: StateCreator<T>,
  _options: PersistOptions,
): StateCreator<T> {
  throw new Error("TODO: wrap set to persist; rehydrate initial from storage");
}

export function createMemoryStorage(): PersistStorage {
  const map = new Map<string, string>();
  return {
    getItem: (name) => map.get(name) ?? null,
    setItem: (name, value) => {
      map.set(name, value);
    },
    removeItem: (name) => {
      map.delete(name);
    },
  };
}

export interface DevtoolsEntry {
  name: string;
  state: unknown;
}

export interface DevtoolsOptions {
  name?: string;
  logger: (entry: DevtoolsEntry) => void;
}

export function devtools<T extends object>(
  _initializer: StateCreator<T>,
  _options: DevtoolsOptions,
): StateCreator<T> {
  const _setType: SetState<T> | undefined = undefined; // hint: you will wrap a SetState
  void _setType;
  throw new Error("TODO: wrap set to log post-set state to the logger");
}
