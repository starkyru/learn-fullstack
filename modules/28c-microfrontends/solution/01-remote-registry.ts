/**
 * A Module-Federation-style remote registry, from scratch — no library. A "remote" is a separately
 * deployed micro-frontend whose `remoteEntry` exposes a bag of mountable modules by name. Loading a
 * remote is a NETWORK cost, so the registry must fetch each remote's container AT MOST ONCE and
 * reuse it — even when several parts of the shell ask for the remote concurrently.
 *
 *   - A `RemoteModule` is the runtime unit: `mount(el, props)` renders it into a host element and
 *     returns an `unmount` fn (the disposer).
 *   - A `RemoteLoader` simulates fetching a remote's `remoteEntry` — it resolves to the container:
 *     a `Record<moduleName, RemoteModule>`.
 *   - `createRemoteRegistry()` gives you `register(name, loader)`, `loadRemote(name, moduleName)`
 *     and `clear()`. `loadRemote` dedupes: it stores the loader's promise the first time and REUSES
 *     it for every later (or concurrent) call, so the loader runs once per remote; then it picks the
 *     exposed module by name. Unknown remote or unknown module names throw a clear error.
 */

export interface RemoteModule {
  mount(el: HTMLElement, props?: unknown): () => void;
}

/** The shape a remote's `remoteEntry` resolves to: mountable modules keyed by their exposed name. */
export type RemoteContainer = Record<string, RemoteModule>;

/** Simulates fetching a remote's `remoteEntry` — resolves to the container exposing its modules. */
export type RemoteLoader = () => Promise<RemoteContainer>;

export interface RemoteRegistry {
  register(name: string, loader: RemoteLoader): void;
  loadRemote(name: string, moduleName: string): Promise<RemoteModule>;
  clear(): void;
}

interface RemoteEntry {
  loader: RemoteLoader;
  /** The in-flight OR resolved container promise. Present ⇒ the loader has already been invoked. */
  container?: Promise<RemoteContainer>;
}

export function createRemoteRegistry(): RemoteRegistry {
  const remotes = new Map<string, RemoteEntry>();

  const register = (name: string, loader: RemoteLoader): void => {
    remotes.set(name, { loader });
  };

  const loadRemote = async (name: string, moduleName: string): Promise<RemoteModule> => {
    const entry = remotes.get(name);
    if (entry === undefined) {
      throw new Error(`Unknown remote: "${name}"`);
    }
    // Dedupe: kick the loader off ONCE (synchronously, before any await) and cache its promise, so
    // concurrent and later calls all await the same container instead of re-fetching.
    if (entry.container === undefined) {
      entry.container = entry.loader();
    }
    const container = await entry.container;
    const remoteModule = container[moduleName];
    if (remoteModule === undefined) {
      throw new Error(`Remote "${name}" does not expose module "${moduleName}"`);
    }
    return remoteModule;
  };

  const clear = (): void => {
    // Drop cached containers but keep registrations — the next load re-invokes the loader.
    for (const entry of remotes.values()) {
      entry.container = undefined;
    }
  };

  return { register, loadRemote, clear };
}
