import { describe, expect, it, vi } from "vitest";
import {
  createRemoteRegistry,
  type RemoteModule,
} from "../solution/01-remote-registry.js";
import { createShell } from "../solution/03-shell.js";

/** A fake remote whose `mount` and returned `unmount` are spies, so tests can assert call counts. */
function fakeRemote() {
  const unmount = vi.fn();
  const mount = vi.fn((_el: HTMLElement, _props?: unknown) => unmount);
  const module: RemoteModule = { mount };
  return { module, mount, unmount };
}

/** A shell whose registry serves `module` at remote "shop" under name "App". */
function setup(module: RemoteModule) {
  const registry = createRemoteRegistry();
  registry.register("shop", async () => ({ App: module }));
  return createShell(registry);
}

describe("createShell", () => {
  it("mount then unmount disposes exactly once, drops the mount, and refuses a double-unmount", async () => {
    const { module, unmount } = fakeRemote();
    const shell = setup(module);

    const id = await shell.mount({
      remote: "shop",
      module: "App",
      el: document.createElement("div"),
    });
    expect(shell.mountedCount()).toBe(1);

    expect(shell.unmount(id)).toBe(true);
    expect(unmount).toHaveBeenCalledTimes(1);
    expect(shell.mountedCount()).toBe(0);

    // Reference released: a second unmount is a no-op, not a double-dispose.
    expect(shell.unmount(id)).toBe(false);
    expect(unmount).toHaveBeenCalledTimes(1);
  });

  it("passes the target element and props through to the remote module's mount", async () => {
    const { module, mount } = fakeRemote();
    const shell = setup(module);
    const el = document.createElement("section");

    await shell.mount({ remote: "shop", module: "App", el, props: { user: "kim" } });

    expect(mount).toHaveBeenCalledTimes(1);
    expect(mount).toHaveBeenCalledWith(el, { user: "kim" });
  });

  it("assigns deterministic, distinct mount ids from an internal counter", async () => {
    const a = fakeRemote();
    const b = fakeRemote();
    const registry = createRemoteRegistry();
    registry.register("a", async () => ({ App: a.module }));
    registry.register("b", async () => ({ App: b.module }));
    const shell = createShell(registry);

    const id1 = await shell.mount({
      remote: "a",
      module: "App",
      el: document.createElement("div"),
    });
    const id2 = await shell.mount({
      remote: "b",
      module: "App",
      el: document.createElement("div"),
    });

    expect(id1).toBe("m1");
    expect(id2).toBe("m2");
    expect(shell.mountedCount()).toBe(2);
  });

  it("a disposer that re-enters unmount() is a no-op, not a double-dispose", async () => {
    // The mount is removed from the active map BEFORE its disposer runs, so if the disposer
    // itself calls shell.unmount(id) the second call finds nothing and returns false — the
    // disposer body runs exactly once. (Guards against dispose-before-delete reentrancy.)
    const disposeBody = vi.fn();
    // Holder so the disposer closure can reach the shell + its own id, which only exist after mount.
    const ctx: { shell: ReturnType<typeof createShell> | null; id: string } = {
      shell: null,
      id: "",
    };
    const reentrant: RemoteModule = {
      mount: () => () => {
        disposeBody();
        // Re-enter: must be a no-op because we've already been removed from the map.
        expect(ctx.shell!.unmount(ctx.id)).toBe(false);
      },
    };
    const registry = createRemoteRegistry();
    registry.register("re", async () => ({ App: reentrant }));
    ctx.shell = createShell(registry);

    ctx.id = await ctx.shell.mount({
      remote: "re",
      module: "App",
      el: document.createElement("div"),
    });
    expect(ctx.shell.unmount(ctx.id)).toBe(true);
    expect(disposeBody).toHaveBeenCalledTimes(1); // ran once despite the reentrant call
    expect(ctx.shell.mountedCount()).toBe(0);
  });

  it("never recycles a mount id after unmount (monotonic counter)", async () => {
    const a = fakeRemote();
    const b = fakeRemote();
    const registry = createRemoteRegistry();
    registry.register("a", async () => ({ App: a.module }));
    registry.register("b", async () => ({ App: b.module }));
    const shell = createShell(registry);

    const id1 = await shell.mount({
      remote: "a",
      module: "App",
      el: document.createElement("div"),
    });
    expect(shell.unmount(id1)).toBe(true); // free m1
    const id2 = await shell.mount({
      remote: "b",
      module: "App",
      el: document.createElement("div"),
    });

    expect(id1).toBe("m1");
    expect(id2).toBe("m2"); // NOT reused as m1 even though m1 is now free
    expect(id2).not.toBe(id1);
  });

  it("unmountAll disposes every active mount exactly once and empties the shell", async () => {
    const a = fakeRemote();
    const b = fakeRemote();
    const registry = createRemoteRegistry();
    registry.register("a", async () => ({ App: a.module }));
    registry.register("b", async () => ({ App: b.module }));
    const shell = createShell(registry);

    await shell.mount({ remote: "a", module: "App", el: document.createElement("div") });
    await shell.mount({ remote: "b", module: "App", el: document.createElement("div") });

    shell.unmountAll();

    expect(a.unmount).toHaveBeenCalledTimes(1);
    expect(b.unmount).toHaveBeenCalledTimes(1);
    expect(shell.mountedCount()).toBe(0);
  });

  it("isolates a failing mount: a throwing remote rejects and leaves mountedCount unchanged", async () => {
    const boom: RemoteModule = {
      mount: () => {
        throw new Error("mount failed");
      },
    };
    const registry = createRemoteRegistry();
    registry.register("bad", async () => ({ App: boom }));
    const shell = createShell(registry);

    await expect(
      shell.mount({ remote: "bad", module: "App", el: document.createElement("div") }),
    ).rejects.toThrow("mount failed");
    expect(shell.mountedCount()).toBe(0);
  });

  it("drives a real jsdom node: the remote appends on mount and its disposer removes it on unmount", async () => {
    const domRemote: RemoteModule = {
      mount: (el) => {
        const node = document.createElement("span");
        node.textContent = "remote";
        el.appendChild(node);
        return () => {
          el.removeChild(node);
        };
      },
    };
    const registry = createRemoteRegistry();
    registry.register("ui", async () => ({ Widget: domRemote }));
    const shell = createShell(registry);
    const host = document.createElement("div");

    const id = await shell.mount({ remote: "ui", module: "Widget", el: host });
    expect(host.childNodes.length).toBe(1);
    expect(host.textContent).toBe("remote");

    shell.unmount(id);
    expect(host.childNodes.length).toBe(0);
  });
});
