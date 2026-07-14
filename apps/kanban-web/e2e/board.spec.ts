import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("a learner can open the board's add-card form without accessibility violations", async ({
  page,
}) => {
  await page.goto("/board");
  await expect(page.getByRole("heading", { name: "Launch Plan" })).toBeVisible();
  await expect(page.getByText("Draft the roadmap")).toBeVisible();

  await page.getByRole("button", { name: "Add card" }).first().click();
  await expect(page.getByLabel("New card")).toBeVisible();
  await page.getByRole("button", { name: "Cancel" }).click();

  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
});
