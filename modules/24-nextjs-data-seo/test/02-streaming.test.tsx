import { act, render, screen } from "@testing-library/react";
import { useReducer } from "react";
import { describe, expect, it } from "vitest";
import {
  type Activity,
  BoardWithFeed,
  loadActivityFeed,
} from "../solution/02-streaming.js";

// Harness: a force-render trigger flushes React's Suspense retry once the promise
// settles (jsdom doesn't schedule the ping on its own). We still assert the real
// fallback → content transition for the SAME promise instance.
let forceRerender: () => void = () => {};
function Harness({ feed }: { feed: Promise<Activity[]> }) {
  const [, force] = useReducer((x: number) => x + 1, 0);
  forceRerender = force;
  return <BoardWithFeed feed={feed} />;
}

const FEED: Activity[] = [
  { id: "1", text: "Ada moved “Login” to Done" },
  { id: "2", text: "Lin commented on “API”" },
];

describe("BoardWithFeed — streaming the slow feed behind the shell", () => {
  it("paints the board shell immediately and shows the fallback while the feed is pending", () => {
    let resolve!: () => void;
    const gate = new Promise<void>((r) => (resolve = r));
    const feed = loadActivityFeed(FEED, () => gate);

    render(<Harness feed={feed} />);

    // Shell is synchronous; feed content is not there yet.
    expect(screen.getByRole("heading", { name: "Sprint Board" })).toBeInTheDocument();
    expect(screen.getByText("Loading activity…")).toBeInTheDocument();
    expect(screen.queryByText("Ada moved “Login” to Done")).not.toBeInTheDocument();

    resolve();
  });

  it("streams the feed content in and drops the fallback once the promise resolves", async () => {
    const feed = loadActivityFeed(FEED);
    render(<Harness feed={feed} />);

    expect(screen.getByText("Loading activity…")).toBeInTheDocument();

    await act(async () => {
      await feed;
    });
    act(() => forceRerender());

    expect(screen.queryByText("Loading activity…")).not.toBeInTheDocument();
    expect(screen.getByText("Ada moved “Login” to Done")).toBeInTheDocument();
    expect(screen.getByText("Lin commented on “API”")).toBeInTheDocument();
    // The shell is still present alongside the streamed content.
    expect(screen.getByRole("heading", { name: "Sprint Board" })).toBeInTheDocument();
  });

  it("renders one <li> per activity under the activity list", async () => {
    const feed = loadActivityFeed(FEED);
    render(<Harness feed={feed} />);
    await act(async () => {
      await feed;
    });
    act(() => forceRerender());

    const list = screen.getByRole("list", { name: "activity" });
    expect(list.querySelectorAll("li")).toHaveLength(2);
  });

  it("loadActivityFeed resolves to the items after its injected delay settles", async () => {
    let resolve!: () => void;
    const gate = new Promise<void>((r) => (resolve = r));
    const promise = loadActivityFeed(FEED, () => gate);

    let settled = false;
    void promise.then(() => (settled = true));
    await Promise.resolve();
    expect(settled).toBe(false); // still gated

    resolve();
    await expect(promise).resolves.toEqual(FEED);
  });

  it("renders an empty activity list for an empty feed", async () => {
    const feed = loadActivityFeed([]);
    render(<Harness feed={feed} />);
    await act(async () => {
      await feed;
    });
    act(() => forceRerender());

    const list = screen.getByRole("list", { name: "activity" });
    expect(list.querySelectorAll("li")).toHaveLength(0);
  });
});
