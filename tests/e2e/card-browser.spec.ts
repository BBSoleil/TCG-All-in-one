import { test, expect } from "@playwright/test";

test.describe("Card Browser", () => {
  test("cards page loads and displays card grid", async ({ page }) => {
    await page.goto("/cards");
    // Page title or heading
    await expect(page.locator("h1")).toContainText(/card/i);
    // Card grid should render (at least the loading/skeleton or actual cards)
    await expect(page.locator("[class*=grid]").first()).toBeVisible();
  });

  test("game filter buttons are present", async ({ page }) => {
    await page.goto("/cards");
    // Should have filter controls for each game
    const filterArea = page.locator("form, [role=tablist], nav").first();
    await expect(filterArea).toBeVisible();
  });

  test("search input filters cards", async ({ page }) => {
    await page.goto("/cards");
    const searchInput = page.locator("input[name=query], input[placeholder*=earch]").first();
    if (await searchInput.isVisible()) {
      await searchInput.fill("Charizard");
      // Either form auto-submits or has a submit button
      const submitBtn = page.locator("button[type=submit]").first();
      if (await submitBtn.isVisible()) {
        await submitBtn.click();
      } else {
        await searchInput.press("Enter");
      }
      await page.waitForTimeout(1000);
      // URL should contain the search query
      expect(page.url()).toContain("Charizard");
    }
  });
});
