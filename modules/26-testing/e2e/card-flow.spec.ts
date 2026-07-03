/**
 * ARTIFACT — Playwright E2E spec (Task 4): log in → create card → see it. The GATE never runs this
 * (no browser at unit-test time). It is the browser twin of the pure `cardFlowSteps`/`runFlow`
 * orchestration unit-tested in `test/04-e2e.test.ts`: same ordered actions, driven for real here.
 *
 * Run manually with: `pnpm exec playwright test`.
 */
import { expect, test } from "@playwright/test";
import { cardFlowSteps, runFlow } from "../solution/04-e2e.js";
import type { E2EDriver } from "../solution/04-e2e.js";

test("log in, create a card, and see it on the board", async ({ page }) => {
  // Adapt Playwright's `page` to the driver contract, then replay the shared step list.
  const driver: E2EDriver = {
    goto: (url) => page.goto(url).then(() => undefined),
    fill: (selector, value) => page.fill(selector, value),
    click: (selector) => page.click(selector),
    textOf: async (selector) => (await page.locator(selector).textContent()) ?? "",
  };

  const steps = cardFlowSteps({
    baseUrl: process.env.E2E_BASE_URL ?? "http://localhost:3000",
    username: "ada",
    password: "hunter2",
    cardTitle: "Buy milk",
  });

  await runFlow(driver, steps);

  // Belt-and-suspenders assertion at the Playwright layer too.
  await expect(page.getByTestId("board")).toContainText("Buy milk");
});
