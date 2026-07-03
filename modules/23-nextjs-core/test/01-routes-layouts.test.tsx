import { describe, expect, it } from "vitest";
import type { ReactElement } from "react";
import {
  BoardLayout,
  CardDetailLayout,
  RootLayout,
} from "../solution/01-routes-layouts.js";

// The layouts are async Server Components: awaiting one returns the element tree,
// which we inspect by `.type`/`.props` — no renderer needed.
type El = ReactElement<Record<string, unknown>, string>;
const props = (el: El): Record<string, unknown> => el.props;
const kids = (el: El): El[] => {
  const c = props(el).children;
  return (Array.isArray(c) ? c : [c]) as El[];
};

describe("RootLayout", () => {
  it("wraps children in html > body > main#app, passing children through untouched", async () => {
    const child = (<p>slot</p>) as El;
    const el = (await RootLayout({ children: child })) as El;

    expect(el.type).toBe("html");
    expect(props(el).lang).toBe("en");

    const body = kids(el)[0]!;
    expect(body.type).toBe("body");

    const main = props(body).children as El;
    expect(main.type).toBe("main");
    expect(props(main).id).toBe("app");
    // The exact same element instance flows through — a layout owns frame, not data.
    expect(props(main).children).toBe(child);
  });
});

describe("BoardLayout (worked example)", () => {
  it("renders a labeled nav with a /board link and a content section", async () => {
    const el = (await BoardLayout({ children: (<p>x</p>) as El })) as El;

    expect(el.type).toBe("div");
    expect(props(el).className).toBe("board-layout");

    const nav = kids(el)[0]!;
    expect(nav.type).toBe("nav");
    expect(props(nav)["aria-label"]).toBe("board-nav");
    const link = props(nav).children as El;
    expect(link.type).toBe("a");
    expect(props(link).href).toBe("/board");
    expect(props(link).children).toBe("Board");
  });

  it("passes children into the content section unchanged", async () => {
    const child = (<span>page</span>) as El;
    const el = (await BoardLayout({ children: child })) as El;

    const section = kids(el)[1]!;
    expect(section.type).toBe("section");
    expect(props(section)["aria-label"]).toBe("board-content");
    expect(props(section).children).toBe(child);
  });
});

describe("CardDetailLayout (analog)", () => {
  it("wraps children with a back-link to /board and a content article", async () => {
    const child = (<p>card body</p>) as El;
    const el = (await CardDetailLayout({ children: child })) as El;

    expect(el.type).toBe("div");
    expect(props(el).className).toBe("card-detail");

    const back = kids(el)[0]!;
    expect(back.type).toBe("a");
    expect(props(back).href).toBe("/board");
    expect(props(back).children).toBe("Back to board");

    const article = kids(el)[1]!;
    expect(article.type).toBe("article");
    expect(props(article)["aria-label"]).toBe("card-detail-content");
    expect(props(article).children).toBe(child);
  });
});
