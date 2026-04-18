import { test, expect } from "@playwright/test";

// /cards is behind middleware matcher — unauthenticated users get redirected
// to /login. The authenticated-user flow is covered by post-login-smoke.spec.ts.
test.describe("Card Browser", () => {
  test("cards page redirects unauthenticated users to login", async ({ page }) => {
    await page.goto("/cards");
    await page.waitForURL(/\/login/);
    expect(page.url()).toContain("login");
  });
});
