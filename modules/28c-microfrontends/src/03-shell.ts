import type { RemoteRegistry } from "./01-remote-registry.js";

/**
 * Build the host shell from scratch: mount remotes and tear them down without leaking.
 *
 * YOUR TURN — implement `createShell`:
 *   - keep a `Map<mountId, unmountFn>` and an incrementing counter for ids (`m1`, `m2`, … — never
 *     Math.random()/Date.now()).
 *   - mount(req): loadRemote via the registry, call remoteModule.mount(el, props), store the
 *     returned disposer under a fresh mountId, return the id. A throwing mount must reject only that
 *     call and leave mountedCount unchanged (do the bookkeeping AFTER a successful mount).
 *   - unmount(id): run the stored disposer exactly once, delete it (no leak), return true; return
 *     false for unknown/already-unmounted ids without disposing.
 *   - mountedCount(): number of active mounts. unmountAll(): dispose each once and empty the shell.
 */

export interface MountRequest {
  remote: string;
  module: string;
  el: HTMLElement;
  props?: unknown;
}

export interface Shell {
  mount(request: MountRequest): Promise<string>;
  unmount(mountId: string): boolean;
  mountedCount(): number;
  unmountAll(): void;
}

export function createShell(_registry: RemoteRegistry): Shell {
  throw new Error(
    "TODO: build the shell (mount / unmount once / mountedCount / unmountAll)",
  );
}
