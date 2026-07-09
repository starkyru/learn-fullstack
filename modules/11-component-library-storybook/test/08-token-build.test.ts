import { describe, expect, it } from "vitest";
import {
  flattenDtcg,
  resolveDtcg,
  toCssVars,
  type DtcgNode,
} from "../solution/08-token-build.js";

// A W3C DTCG document: nested groups, `$value`/`$type` tokens, and `{dotted.path}` aliases.
const DOC: DtcgNode = {
  color: {
    blue: { "600": { $value: "#4f46e5", $type: "color" } },
    white: { $value: "#ffffff", $type: "color" },
    action: { $value: "{color.blue.600}", $type: "color" },
    "action-fg": { $value: "{color.white}", $type: "color" },
  },
};

describe("flattenDtcg", () => {
  it("flattens nested groups to dotted paths, leaving aliases unresolved", () => {
    expect(flattenDtcg(DOC)).toEqual({
      "color.blue.600": "#4f46e5",
      "color.white": "#ffffff",
      "color.action": "{color.blue.600}",
      "color.action-fg": "{color.white}",
    });
  });
});

describe("resolveDtcg", () => {
  it("resolves every alias to a concrete literal", () => {
    expect(resolveDtcg(DOC)).toEqual({
      "color.blue.600": "#4f46e5",
      "color.white": "#ffffff",
      "color.action": "#4f46e5",
      "color.action-fg": "#ffffff",
    });
  });

  it("follows a multi-hop alias chain", () => {
    const chain: DtcgNode = {
      a: { $value: "#0b1020" },
      b: { $value: "{a}" },
      c: { $value: "{b}" },
    };
    expect(resolveDtcg(chain)["c"]).toBe("#0b1020");
  });

  it("throws on an unknown reference", () => {
    const bad: DtcgNode = { x: { $value: "{color.missing}" } };
    expect(() => resolveDtcg(bad)).toThrow("Unknown token reference: color.missing");
  });

  it("throws on a cyclic reference", () => {
    const loop: DtcgNode = { a: { $value: "{b}" }, b: { $value: "{a}" } };
    expect(() => resolveDtcg(loop)).toThrow(/Cyclic token reference/);
  });
});

describe("toCssVars", () => {
  it("emits a :root rule with dotted paths dashed into custom properties", () => {
    expect(toCssVars(resolveDtcg(DOC))).toBe(
      ":root {\n" +
        "  --color-blue-600: #4f46e5;\n" +
        "  --color-white: #ffffff;\n" +
        "  --color-action: #4f46e5;\n" +
        "  --color-action-fg: #ffffff;\n" +
        "}",
    );
  });

  it("honors a custom selector for a themed root", () => {
    expect(toCssVars({ "color.action": "#818cf8" }, '[data-theme="dark"]')).toBe(
      '[data-theme="dark"] {\n  --color-action: #818cf8;\n}',
    );
  });
});
