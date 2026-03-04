import { test, expect } from "@playwright/test";

test.describe("Social", () => {
  test("social page redirects unauthenticated users", async ({ page }) => {
    await page.goto("/social");
    await page.waitForURL(/\/(login|api\/auth)/);
    expect(page.url()).toContain("login");
  });

  test("leaderboards page redirects unauthenticated users", async ({ page }) => {
    await page.goto("/leaderboards");
    await page.waitForURL(/\/(login|api\/auth)/);
    expect(page.url()).toContain("login");
  });
});
