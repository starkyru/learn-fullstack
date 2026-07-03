/**
 * Build a Module-Federation-style remote registry from scratch: a `Map` of remotes, each fetched at
 * most once and cached.
 *
 * YOUR TURN — implement `createRemoteRegistry`:
 *   - register(name, loader): store the loader under the remote name.
 *   - loadRemote(name, moduleName): throw if the remote is unknown; the FIRST call kicks the loader
 *     off (synchronously, before any await) and caches its container promise; concurrent/later calls
 *     REUSE that promise (loader runs once). Await it, then pick `container[moduleName]` — throw if
 *     the exposed module name is unknown. Return the `RemoteModule`.
 *   - clear(): drop cached containers but keep registrations, so the next load re-invokes the loader.
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

export function createRemoteRegistry(): RemoteRegistry {
  throw new Error(
    "TODO: build the remote registry (register / loadRemote with dedupe / clear)",
  );
}
