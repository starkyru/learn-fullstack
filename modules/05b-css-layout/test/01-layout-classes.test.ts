import { describe, expect, it } from "vitest";
import { boardColumn, cardGrid } from "../solution/01-layout-classes.js";

describe("boardColumn (Flexbox composer)", () => {
  it("emits a vertical flex column with default gap and full width", () => {
    expect(boardColumn()).toEqual({
      className: "board-column",
      style: {
        display: "flex",
        flexDirection: "column",
        gap: "8px",
        width: "272px",
      },
    });
  });

  it("collapsed adds the modifier class and shrinks to the rail width", () => {
    const result = boardColumn({ collapsed: true });
    expect(result.className).toBe("board-column board-column--collapsed");
    expect(result.style.width).toBe("48px");
  });

  it("threads the custom gap into the style", () => {
    expect(boardColumn({ gap: 20 }).style.gap).toBe("20px");
  });
});

describe("cardGrid (Grid composer)", () => {
  it("emits a 3-column grid by default", () => {
    expect(cardGrid()).toEqual({
      className: "card-grid card-grid--cols-3",
      style: {
        display: "grid",
        gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
        gap: "16px",
      },
    });
  });

  it("reflects the column count in both className and template", () => {
    const result = cardGrid({ columns: 4 });
    expect(result.className).toBe("card-grid card-grid--cols-4");
    expect(result.style.gridTemplateColumns).toBe("repeat(4, minmax(0, 1fr))");
  });

  it("threads the custom gap into the style", () => {
    expect(cardGrid({ columns: 2, gap: 24 }).style.gap).toBe("24px");
  });
});
