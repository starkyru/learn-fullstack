import { describe, expect, it } from "vitest";
import { resolveLocale } from "../solution/01-locale.js";
import { formatMessage } from "../solution/02-messages.js";

describe("i18n primitives", () => {
  it("uses language and fallback matching predictably", () => {
    expect(resolveLocale("fr_CA", ["en-US", "fr-FR"], "en-US")).toBe("fr-FR");
    expect(resolveLocale("ja-JP", ["en-US"], "en-US")).toBe("en-US");
  });
  it("does not silently render an incomplete message", () => {
    expect(formatMessage("{name} has {count} cards", { name: "Ada", count: 2 })).toBe(
      "Ada has 2 cards",
    );
    expect(() => formatMessage("Hello {name}", {})).toThrow(
      "missing message variable: name",
    );
  });
});
