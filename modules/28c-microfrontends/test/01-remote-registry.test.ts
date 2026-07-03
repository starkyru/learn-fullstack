import { describe, expect, it, vi } from "vitest";
import {
  createRemoteRegistry,
  type RemoteContainer,
  type RemoteModule,
} from "../solution/01-remote-registry.js";

/** A throwaway remote module — the registry never mounts it, so a no-op is enough. */
function fakeModule(): RemoteModule {
  return { mount: () => () => {} };
}

describe("createRemoteRegistry", () => {
  it("dedupes concurrent loads: the loader runs exactly once and both callers get the same module", async () => {
    const appModule = fakeModule();
    const loader = vi.fn(async (): Promise<RemoteContainer> => ({ App: appModule }));
    const registry = createRemoteRegistry();
    registry.register("shop", loader);

    const [a, b] = await Promise.all([
      registry.loadRemote("shop", "App"),
      registry.loadRemote("shop", "App"),
    ]);

    expect(loader).toHaveBeenCalledTimes(1);
    expect(a).toBe(appModule);
    expect(b).toBe(appModule);
  });

  it("caches the resolved container so a second sequential load does not re-invoke the loader", async () => {
    const loader = vi.fn(async (): Promise<RemoteContainer> => ({ App: fakeModule() }));
    const registry = createRemoteRegistry();
    registry.register("shop", loader);

    const first = await registry.loadRemote("shop", "App");
    const second = await registry.loadRemote("shop", "App");

    expect(loader).toHaveBeenCalledTimes(1);
    expect(second).toBe(first); // same cached container ⇒ same module instance
  });

  it("throws for an unknown remote", async () => {
    const registry = createRemoteRegistry();
    await expect(registry.loadRemote("nope", "App")).rejects.toThrow(
      'Unknown remote: "nope"',
    );
  });

  it("throws when the remote does not expose the requested module", async () => {
    const registry = createRemoteRegistry();
    registry.register("shop", async () => ({ App: fakeModule() }));
    await expect(registry.loadRemote("shop", "Missing")).rejects.toThrow(
      'Remote "shop" does not expose module "Missing"',
    );
  });

  it("clear() drops the cache so the next load re-invokes the loader", async () => {
    const loader = vi.fn(async (): Promise<RemoteContainer> => ({ App: fakeModule() }));
    const registry = createRemoteRegistry();
    registry.register("shop", loader);

    await registry.loadRemote("shop", "App");
    registry.clear();
    await registry.loadRemote("shop", "App");

    expect(loader).toHaveBeenCalledTimes(2);
  });

  it("selects the exposed module by name from a multi-module container", async () => {
    const header = fakeModule();
    const footer = fakeModule();
    const registry = createRemoteRegistry();
    registry.register("layout", async () => ({ Header: header, Footer: footer }));

    expect(await registry.loadRemote("layout", "Footer")).toBe(footer);
    expect(await registry.loadRemote("layout", "Header")).toBe(header);
  });
});
