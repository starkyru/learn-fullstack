import type { RemoteModule, RemoteRegistry } from "./01-remote-registry.js";

/**
 * The host shell, from scratch — the container app that mounts remotes and, crucially, TEARS THEM
 * DOWN without leaking. Every mount returns a disposer; the shell keeps each disposer keyed by a
 * generated `mountId` and guarantees it runs exactly once and is dropped from the map afterwards.
 *
 *   - `mount(req)` loads the remote via the registry, calls `remoteModule.mount(el, props)`, stores
 *     the returned unmount fn under a fresh `mountId`, and returns that id. A mount that throws is
 *     isolated — it rejects that call only and leaves the active-mount count unchanged.
 *   - `unmount(id)` runs the stored disposer exactly once, removes it (no retained reference = no
 *     leak), and returns `true`; unknown/already-unmounted ids return `false` and dispose nothing.
 *   - `unmountAll()` disposes every active mount once and empties the shell.
 *
 * Determinism: `mountId`s come from an internal incrementing counter (`m1`, `m2`, …) — never
 * `Math.random()` / `Date.now()`.
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

export function createShell(registry: RemoteRegistry): Shell {
  const active = new Map<string, () => void>();
  let counter = 0;

  const mount = async (request: MountRequest): Promise<string> => {
    const remoteModule: RemoteModule = await registry.loadRemote(
      request.remote,
      request.module,
    );
    // If `mount` throws, we never reach the bookkeeping below — the rejection is isolated and the
    // active count is untouched.
    const dispose = remoteModule.mount(request.el, request.props);
    counter += 1;
    const mountId = `m${counter}`;
    active.set(mountId, dispose);
    return mountId;
  };

  const unmount = (mountId: string): boolean => {
    const dispose = active.get(mountId);
    if (dispose === undefined) return false;
    // Delete BEFORE disposing: releases the reference (no leak) and makes a re-entrant unmount a
    // no-op instead of a double-dispose.
    active.delete(mountId);
    dispose();
    return true;
  };

  const mountedCount = (): number => active.size;

  const unmountAll = (): void => {
    for (const dispose of active.values()) dispose();
    active.clear();
  };

  return { mount, unmount, mountedCount, unmountAll };
}
