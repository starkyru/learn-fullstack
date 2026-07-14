/**
 * ARTIFACT — Playwright E2E spec (Task 4): open the real Kanban board and exercise its add-card UI.
 * The module's unit-test gate never runs this browser artifact; the root E2E command does.
 *
 * Run manually with: `pnpm exec playwright install chromium && pnpm exec playwright test`.
 */
import { expect, test } from "@playwright/test";

test("opens and closes the real board's add-card form", async ({ page }) => {
  await page.goto("/board");
  await expect(page.getByRole("heading", { name: "Launch Plan" })).toBeVisible();

  await page.getByRole("button", { name: "Add card" }).first().click();
  await expect(page.getByLabel("New card")).toBeVisible();

  await page.getByRole("button", { name: "Cancel" }).click();
  await expect(page.getByLabel("New card")).not.toBeVisible();
});
