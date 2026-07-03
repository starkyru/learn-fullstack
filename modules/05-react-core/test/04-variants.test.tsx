import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Badge } from "../solution/01-components.js";
import { badgeVariants } from "../solution/04-variants.js";

describe("badgeVariants", () => {
  it("covers every Badge tone", () => {
    expect(badgeVariants().map((v) => v.args.tone)).toEqual([
      "neutral",
      "success",
      "danger",
    ]);
  });

  it("produces args that actually render a Badge", () => {
    for (const variant of badgeVariants()) {
      const { unmount } = render(<Badge {...variant.args} />);
      expect(screen.getByText(variant.args.label)).toBeInTheDocument();
      unmount();
    }
  });
});
