import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { ReactElement } from "react";
import { BoardView } from "../src/board/board-view.js";
import { AddCardButton } from "../src/board/add-card-button.js";
import BoardPage from "../app/board/page.js";
import type { Board } from "../src/board/board-service.js";

const board: Board = {
  id: "b1",
  title: "Sprint",
  owner: { id: "u1", email: "owner@kanban.dev", name: "Ada" },
  columns: [
    {
      id: "todo",
      title: "To Do",
      cards: [
        { id: "c1", title: "A", columnId: "todo" },
        { id: "c2", title: "B", columnId: "todo" },
      ],
    },
    { id: "doing", title: "Doing", cards: [{ id: "c3", title: "C", columnId: "doing" }] },
  ],
};

// Recursively collect every HOST element (string type) the server tree renders, stopping at
// component boundaries (function types = client islands). Proves the server part ships no
// event handlers.
type Node = { type: unknown; props?: { children?: unknown; [k: string]: unknown } };
function collectHosts(node: unknown, acc: Node[] = []): Node[] {
  if (Array.isArray(node)) {
    for (const n of node) collectHosts(n, acc);
    return acc;
  }
  if (node && typeof node === "object" && "type" in node) {
    const n = node as Node;
    if (typeof n.type === "string") {
      acc.push(n);
      collectHosts(n.props?.children, acc);
    }
  }
  return acc;
}

// Flatten every element (host + component), so we can find the <BoardView> element the page
// creates and read the board prop it was given by the real service.
function flatten(node: unknown, acc: Node[] = []): Node[] {
  if (Array.isArray(node)) {
    for (const n of node) flatten(n, acc);
    return acc;
  }
  if (node && typeof node === "object" && "type" in node) {
    const n = node as Node;
    acc.push(n);
    flatten(n.props?.children, acc);
  }
  return acc;
}

describe("BoardView (server component)", () => {
  it("renders a labeled board section whose columns carry their titles as <h2>s", async () => {
    const el = (await BoardView({ board })) as ReactElement<
      Record<string, unknown>,
      string
    >;
    expect(el.type).toBe("section");
    expect((el.props as Record<string, unknown>)["aria-label"]).toBe("board");

    const titles = collectHosts(el)
      .filter((h) => h.type === "h2")
      .map((h) => h.props?.children);
    expect(titles).toEqual(["To Do", "Doing"]);
  });

  it("renders each column's cards as <li> host elements in order", async () => {
    const el = await BoardView({ board });
    const items = collectHosts(el)
      .filter((h) => h.type === "li")
      .map((h) => h.props?.children);
    expect(items).toEqual(["A", "B", "C"]);
  });

  it("ships NO event handlers on any server-rendered host element", async () => {
    const el = await BoardView({ board });
    const hosts = collectHosts(el);
    expect(hosts.length).toBeGreaterThan(0);
    for (const h of hosts) {
      expect(h.props?.onClick).toBeUndefined();
    }
  });

  it("mounts to the DOM with one Add-card island per column", async () => {
    render(await BoardView({ board }));
    expect(screen.getByRole("region", { name: "board" })).toBeInTheDocument();
    expect(screen.getByText("A")).toBeInTheDocument();
    expect(screen.getByText("C")).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "Add card" })).toHaveLength(2);
  });
});

describe("BoardPage (async RSC route over the real board service)", () => {
  it("fetches the seeded board from boardStore and hands it to a <BoardView>", async () => {
    // The page is an async RSC: await it to get its element tree (we cannot RTL-render an
    // unresolved async component in the client renderer — that needs the RSC runtime).
    const page = await BoardPage();

    const title = collectHosts(page)
      .filter((h) => h.type === "h1")
      .map((h) => h.props?.children);
    expect(title).toEqual(["Launch Plan"]);

    const boardViews = flatten(page).filter((n) => n.type === BoardView);
    expect(boardViews).toHaveLength(1);
    const passed = (boardViews[0]?.props as { board?: Board }).board;
    expect(passed?.id).toBe("b1");
    expect(passed?.columns.flatMap((c) => c.cards.map((k) => k.title))).toEqual([
      "Draft the roadmap",
      "Wire the board RSC",
    ]);

    // Now resolve that real board through the view and prove it reaches the DOM.
    render(await BoardView({ board: passed as Board }));
    expect(screen.getByText("Draft the roadmap")).toBeInTheDocument();
    expect(screen.getByText("Wire the board RSC")).toBeInTheDocument();
  });
});

describe("AddCardButton (client island)", () => {
  it("starts as a trigger button with no inline form, then opens it on click and closes on Cancel", () => {
    render(<AddCardButton boardId="b1" columnId="todo" />);

    expect(screen.getByRole("button", { name: "Add card" })).toBeInTheDocument();
    expect(screen.queryByLabelText("New card")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Add card" }));
    expect(screen.getByLabelText("New card")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Add card" })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.getByRole("button", { name: "Add card" })).toBeInTheDocument();
    expect(screen.queryByLabelText("New card")).not.toBeInTheDocument();
  });
});
