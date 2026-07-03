import { describe, expect, it } from "vitest";
import type { E2EDriver } from "../solution/04-e2e.js";
import { cardFlowSteps, runFlow } from "../solution/04-e2e.js";

const input = {
  baseUrl: "https://app.test",
  username: "ada",
  password: "hunter2",
  cardTitle: "Buy milk",
};

/** A fake driver that records the calls it received and answers `textOf` with a canned board DOM. */
function fakeDriver(boardText: string): { driver: E2EDriver; calls: string[] } {
  const calls: string[] = [];
  const driver: E2EDriver = {
    async goto(url) {
      calls.push(`goto ${url}`);
    },
    async fill(selector, value) {
      calls.push(`fill ${selector}=${value}`);
    },
    async click(selector) {
      calls.push(`click ${selector}`);
    },
    async textOf(selector) {
      calls.push(`textOf ${selector}`);
      return boardText;
    },
  };
  return { driver, calls };
}

describe("Task 4 — E2E flow orchestration (no browser)", () => {
  it("produces the exact ordered steps for login → create card → see it", () => {
    expect(cardFlowSteps(input)).toEqual([
      { kind: "goto", url: "https://app.test/login" },
      { kind: "fill", selector: "#username", value: "ada" },
      { kind: "fill", selector: "#password", value: "hunter2" },
      { kind: "click", selector: "button[type=submit]" },
      { kind: "goto", url: "https://app.test/board" },
      { kind: "fill", selector: "#new-card", value: "Buy milk" },
      { kind: "click", selector: "button[name=add-card]" },
      { kind: "expectText", selector: "[data-testid=board]", text: "Buy milk" },
    ]);
  });

  it("runFlow drives the driver in order when the board shows the card", async () => {
    const { driver, calls } = fakeDriver("Board: Buy milk");
    await runFlow(driver, cardFlowSteps(input));

    expect(calls).toEqual([
      "goto https://app.test/login",
      "fill #username=ada",
      "fill #password=hunter2",
      "click button[type=submit]",
      "goto https://app.test/board",
      "fill #new-card=Buy milk",
      "click button[name=add-card]",
      "textOf [data-testid=board]",
    ]);
  });

  it("runFlow rejects when the final expectText is not satisfied", async () => {
    const { driver } = fakeDriver("Board: (empty)");
    await expect(runFlow(driver, cardFlowSteps(input))).rejects.toThrow(
      /expectText failed/,
    );
  });
});
