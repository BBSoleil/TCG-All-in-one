import { test, expect } from "@playwright/test";

test.describe("Wishlist", () => {
  test("wishlist page redirects unauthenticated users", async ({ page }) => {
    await page.goto("/wishlist");
    await page.waitForURL(/\/(login|api\/auth)/);
    expect(page.url()).toContain("login");
  });
});
