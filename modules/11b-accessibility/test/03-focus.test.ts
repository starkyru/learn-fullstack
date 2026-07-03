import { describe, expect, it } from "vitest";
import { getFocusableElements } from "../solution/03-focus.js";

function build(html: string): HTMLElement {
  const div = document.createElement("div");
  div.innerHTML = html;
  return div;
}

describe("getFocusableElements", () => {
  it("returns focusable nodes in DOM order", () => {
    const c = build(`<a href="#">a</a><button>b</button><input />`);
    expect(getFocusableElements(c).map((e) => e.tagName)).toEqual([
      "A",
      "BUTTON",
      "INPUT",
    ]);
  });

  it("excludes disabled elements and tabindex=-1", () => {
    const c = build(
      `<button disabled>x</button><div tabindex="-1">y</div><button>z</button>`,
    );
    const result = getFocusableElements(c);
    expect(result).toHaveLength(1);
    expect(result[0]?.textContent).toBe("z");
  });
});
