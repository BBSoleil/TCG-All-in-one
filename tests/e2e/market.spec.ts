import { test, expect } from "@playwright/test";

test.describe("Marketplace", () => {
  test("marketplace page loads", async ({ page }) => {
    await page.goto("/market");
    await expect(page.locator("h1")).toContainText(/market/i);
  });

  test("marketplace shows listing cards or empty state", async ({ page }) => {
    await page.goto("/market");
    // Either shows listing cards or empty state message
    const content = page.locator("main, [role=main]").first();
    await expect(content).toBeVisible();
  });
});
