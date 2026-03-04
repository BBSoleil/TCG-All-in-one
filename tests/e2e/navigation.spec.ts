import { test, expect } from "@playwright/test";

test.describe("Public Pages", () => {
  test("landing page renders", async ({ page }) => {
    await page.goto("/");
    // Either shows landing content or redirects to login/dashboard
    await page.waitForLoadState("domcontentloaded");
    const url = page.url();
    // Landing, login, or dashboard — all acceptable
    expect(url).toMatch(/\/(login|collection|features|$)/);
  });

  test("features page renders", async ({ page }) => {
    const response = await page.goto("/features");
    // Should render or redirect (not 500)
    expect(response?.status()).toBeLessThan(500);
  });

  test("pricing page renders", async ({ page }) => {
    const response = await page.goto("/pricing");
    expect(response?.status()).toBeLessThan(500);
  });

  test("404 page shows for unknown routes", async ({ page }) => {
    const response = await page.goto("/this-does-not-exist-xyz");
    expect(response?.status()).toBe(404);
  });
});

test.describe("Navigation Links", () => {
  test("login page has link to signup", async ({ page }) => {
    await page.goto("/login");
    const signupLink = page.locator("a[href*=signup]");
    await expect(signupLink).toBeVisible();
  });

  test("signup page has link to login", async ({ page }) => {
    await page.goto("/signup");
    const loginLink = page.locator("a[href*=login]");
    await expect(loginLink).toBeVisible();
  });
});
