import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { ReactElement } from "react";
import { AddCardButton, BoardView, type Board } from "../solution/02-server-client.js";

const board: Board = {
  columns: [
    { id: "todo", title: "To Do", cards: ["Write RSC"] },
    { id: "done", title: "Done", cards: [] },
  ],
};

// Recursively collect every HOST element (string type) the server tree renders,
// stopping at component boundaries (function types = client islands). This lets us
// prove the server part ships no event handlers.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function collectHosts(node: any, acc: any[] = []): any[] {
  if (Array.isArray(node)) {
    for (const n of node) collectHosts(n, acc);
    return acc;
  }
  if (node && typeof node === "object" && "type" in node) {
    if (typeof node.type === "string") {
      acc.push(node);
      collectHosts(node.props?.children, acc);
    }
  }
  return acc;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function flatten(node: any, acc: any[] = []): any[] {
  if (Array.isArray(node)) {
    for (const n of node) flatten(n, acc);
    return acc;
  }
  if (node && typeof node === "object" && "type" in node) {
    acc.push(node);
    flatten(node.props?.children, acc);
  }
  return acc;
}

describe("AddCardButton (client island)", () => {
  it("starts as a trigger button with no inline form", () => {
    render(<AddCardButton />);
    expect(screen.getByRole("button", { name: "Add card" })).toBeInTheDocument();
    expect(screen.queryByLabelText("New card")).not.toBeInTheDocument();
  });

  it("opens the inline new-card form when clicked, then closes on Cancel", () => {
    render(<AddCardButton />);

    fireEvent.click(screen.getByRole("button", { name: "Add card" }));
    expect(screen.getByLabelText("New card")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Add card" })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.getByRole("button", { name: "Add card" })).toBeInTheDocument();
    expect(screen.queryByLabelText("New card")).not.toBeInTheDocument();
  });
});

describe("BoardView (server component)", () => {
  it("renders the board as a labeled section with column titles as static <h2>s", async () => {
    const el = (await BoardView({ board })) as ReactElement<
      Record<string, unknown>,
      string
    >;
    expect(el.type).toBe("section");
    expect((el.props as Record<string, unknown>)["aria-label"]).toBe("board");

    const titles = collectHosts(el)
      .filter((h) => h.type === "h2")
      .map((h) => h.props.children);
    expect(titles).toEqual(["To Do", "Done"]);
  });

  it("renders each column's cards as <li> host elements", async () => {
    const el = await BoardView({ board });
    const items = collectHosts(el)
      .filter((h) => h.type === "li")
      .map((h) => h.props.children);
    expect(items).toEqual(["Write RSC"]);
  });

  it("ships NO event handlers on any server-rendered host element", async () => {
    const el = await BoardView({ board });
    const hosts = collectHosts(el);
    expect(hosts.length).toBeGreaterThan(0);
    for (const h of hosts) {
      expect(h.props.onClick).toBeUndefined();
    }
  });

  it("delegates interactivity by including the <AddCardButton> client island", async () => {
    const el = await BoardView({ board });
    const islands = flatten(el).filter((n) => n.type === AddCardButton);
    expect(islands).toHaveLength(1);
  });
});
