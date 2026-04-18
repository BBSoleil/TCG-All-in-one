import { test, expect } from "@playwright/test";

test.describe("Social", () => {
  test("social page redirects unauthenticated users", async ({ page }) => {
    await page.goto("/social");
    await page.waitForURL(/\/(login|api\/auth)/);
    expect(page.url()).toContain("login");
  });

  test("leaderboards page is publicly accessible", async ({ page }) => {
    const resp = await page.goto("/leaderboards");
    expect(resp?.status()).toBe(200);
  });
});
