import { describe, expect, it } from "vitest";
import { autoFitGrid, columnsAt } from "../solution/02-intrinsic.js";

describe("autoFitGrid", () => {
  it("builds an auto-fit/minmax grid that reflows with no media queries", () => {
    expect(autoFitGrid(240, 16)).toBe(
      "display: grid; gap: 16px; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));",
    );
  });
});

describe("columnsAt", () => {
  it("computes how many min-width columns fit a container", () => {
    // (1000 + 16) / (240 + 16) = 3.96 -> 3 columns
    expect(columnsAt(1000, 240, 16)).toBe(3);
    // (768 + 16) / 256 = 3.06 -> 3 columns
    expect(columnsAt(768, 240, 16)).toBe(3);
  });

  it("never drops below one column, even when the container is narrower than a column", () => {
    expect(columnsAt(200, 240, 16)).toBe(1);
  });

  it("adds a column exactly when another min-width box + gap fits", () => {
    // one column needs 240; two need 240+16+240 = 496
    expect(columnsAt(495, 240, 16)).toBe(1);
    expect(columnsAt(496, 240, 16)).toBe(2);
  });
});
