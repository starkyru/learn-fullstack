import { describe, expect, it } from "vitest";
import { responsiveGridClasses } from "../solution/05-tailwind.js";

describe("responsiveGridClasses", () => {
  it("emits the mobile base class plus one prefixed class per provided breakpoint, in order", () => {
    expect(responsiveGridClasses({ base: 1, sm: 2, lg: 3 })).toBe(
      "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
    );
  });

  it("skips breakpoints that aren't specified (no md class here)", () => {
    expect(responsiveGridClasses({ base: 1, xl: 4 })).toBe(
      "grid grid-cols-1 xl:grid-cols-4",
    );
  });
});
