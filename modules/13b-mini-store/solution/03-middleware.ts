import type { SetState, StateCreator } from "./01-create-store.js";

/**
 * Middleware is a `StateCreator` wrapper: it takes an initializer and returns a NEW initializer,
 * intercepting `set` (and, for persist, the initial state). Compose them like Zustand:
 *   createStore(persist(devtools(init, { logger }), { name, storage }))
 */

// --- persist ----------------------------------------------------------------------------------

export interface PersistStorage {
  getItem: (name: string) => string | null;
  setItem: (name: string, value: string) => void;
  removeItem: (name: string) => void;
}

export interface PersistOptions {
  name: string;
  storage: PersistStorage;
}

/**
 * `persist` writes the state to `storage` after every `set`, and REHYDRATES the initial state from
 * storage on creation (merging saved data over the freshly-built defaults, so actions survive —
 * JSON has no functions). A corrupt saved value is ignored rather than crashing the store.
 */
export function persist<T extends object>(
  initializer: StateCreator<T>,
  options: PersistOptions,
): StateCreator<T> {
  const { name, storage } = options;
  return (set, get) => {
    const persistingSet: SetState<T> = (partial, replace) => {
      set(partial, replace);
      storage.setItem(name, JSON.stringify(get()));
    };

    const base = initializer(persistingSet, get);

    const saved = storage.getItem(name);
    if (saved !== null) {
      try {
        const parsed = JSON.parse(saved) as Partial<T>;
        return { ...base, ...parsed };
      } catch {
        // Corrupt payload — fall through to defaults.
      }
    }
    return base;
  };
}

/** An in-memory `PersistStorage` (the fake a test injects, and a stand-in where `localStorage` is absent). */
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

// --- devtools ---------------------------------------------------------------------------------

export interface DevtoolsEntry {
  name: string;
  state: unknown;
}

export interface DevtoolsOptions {
  name?: string;
  logger: (entry: DevtoolsEntry) => void;
}

/** `devtools` logs the post-`set` state to an injected `logger` — a stand-in for the Redux DevTools bridge. */
export function devtools<T extends object>(
  initializer: StateCreator<T>,
  options: DevtoolsOptions,
): StateCreator<T> {
  const label = options.name ?? "store";
  return (set, get) => {
    const loggingSet: SetState<T> = (partial, replace) => {
      set(partial, replace);
      options.logger({ name: label, state: get() });
    };
    return initializer(loggingSet, get);
  };
}
