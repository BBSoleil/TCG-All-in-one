import { test, expect } from "@playwright/test";

test.describe("Analytics", () => {
  test("analytics page redirects unauthenticated users", async ({ page }) => {
    await page.goto("/analytics");
    await page.waitForURL(/\/(login|api\/auth)/);
    expect(page.url()).toContain("login");
  });
});
