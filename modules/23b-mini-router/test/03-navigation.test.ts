import { describe, expect, it, vi } from "vitest";
import { buildRouteTable, type FileEntry } from "../solution/01-route-table.js";
import { createRouter } from "../solution/03-navigation.js";

const files: FileEntry[] = [
  { path: "routes/layout", kind: "layout" },
  { path: "routes/page", kind: "page" },
  { path: "routes/cards/layout", kind: "layout" },
  { path: "routes/cards/page", kind: "page" },
  { path: "routes/cards/new/page", kind: "page" },
  { path: "routes/cards/[id]/layout", kind: "layout" },
  { path: "routes/cards/[id]/page", kind: "page" },
];

const table = buildRouteTable(files);

// A deterministic fake of the History API + location, so tests never depend on jsdom's async history.
// `back()` rewinds the injected stack, updates the location, and dispatches a real `popstate` event —
// exactly what the router listens for.
function fakeHistory() {
  const stack: string[] = ["/"];
  let index = 0;
  const loc = { pathname: "/" };

  const pushState = vi.fn((_data: unknown, _unused: string, url?: string | null) => {
    const next = url ?? loc.pathname;
    stack.splice(index + 1);
    stack.push(next);
    index = stack.length - 1;
    loc.pathname = next;
  });

  const back = vi.fn(() => {
    if (index > 0) {
      index -= 1;
      const prev = stack[index];
      if (prev !== undefined) loc.pathname = prev;
      window.dispatchEvent(new PopStateEvent("popstate"));
    }
  });

  return { history: { pushState, back }, loc, pushState, back };
}

describe("createRouter", () => {
  it("pushes history and renders the matched page wrapped in its layouts (outermost-first)", () => {
    const render = vi.fn();
    const fake = fakeHistory();
    const router = createRouter(table, {
      render,
      history: fake.history,
      getLocation: () => fake.loc.pathname,
    });

    router.navigate("/cards/42");

    expect(fake.pushState).toHaveBeenCalledWith(null, "", "/cards/42");
    expect(render).toHaveBeenCalledTimes(1);
    expect(render).toHaveBeenLastCalledWith({
      page: "routes/cards/[id]/page",
      layoutChain: ["routes/layout", "routes/cards/layout", "routes/cards/[id]/layout"],
      params: { id: "42" },
    });

    router.destroy();
  });

  it("exposes the current match via current()", () => {
    const render = vi.fn();
    const fake = fakeHistory();
    const router = createRouter(table, {
      render,
      history: fake.history,
      getLocation: () => fake.loc.pathname,
    });

    router.navigate("/cards/new");

    expect(router.current()).toEqual({
      pathname: "/cards/new",
      page: "routes/cards/new/page",
      layoutChain: ["routes/layout", "routes/cards/layout"],
      params: {},
    });

    router.destroy();
  });

  it("re-renders the previous match on Back (popstate)", () => {
    const render = vi.fn();
    const fake = fakeHistory();
    const router = createRouter(table, {
      render,
      history: fake.history,
      getLocation: () => fake.loc.pathname,
    });

    router.navigate("/cards/42");
    router.navigate("/cards/new");
    expect(render).toHaveBeenLastCalledWith({
      page: "routes/cards/new/page",
      layoutChain: ["routes/layout", "routes/cards/layout"],
      params: {},
    });

    fake.history.back(); // rewinds to /cards/42 and fires popstate

    expect(render).toHaveBeenCalledTimes(3);
    expect(render).toHaveBeenLastCalledWith({
      page: "routes/cards/[id]/page",
      layoutChain: ["routes/layout", "routes/cards/layout", "routes/cards/[id]/layout"],
      params: { id: "42" },
    });
    expect(router.current()?.pathname).toBe("/cards/42");

    router.destroy();
  });

  it("does not render (and current() is null) when the path has no match", () => {
    const render = vi.fn();
    const fake = fakeHistory();
    const router = createRouter(table, {
      render,
      history: fake.history,
      getLocation: () => fake.loc.pathname,
    });

    router.navigate("/nope/nope");

    expect(render).not.toHaveBeenCalled();
    expect(router.current()).toBeNull();

    router.destroy();
  });

  it("stops listening after destroy() — no popstate re-render, no leak", () => {
    const render = vi.fn();
    const fake = fakeHistory();
    const router = createRouter(table, {
      render,
      history: fake.history,
      getLocation: () => fake.loc.pathname,
    });

    router.navigate("/cards/42");
    router.navigate("/cards/new");
    const callsBeforeDestroy = render.mock.calls.length;

    router.destroy();
    window.dispatchEvent(new PopStateEvent("popstate"));

    expect(render.mock.calls.length).toBe(callsBeforeDestroy);
  });
});
