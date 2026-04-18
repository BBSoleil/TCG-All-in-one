import { test, expect } from "@playwright/test";

test.describe("Authentication", () => {
  test("login page renders with form fields", async ({ page }) => {
    await page.goto("/login");
    await expect(page.locator("input[name=email]")).toBeVisible();
    await expect(page.locator("input[name=password]")).toBeVisible();
    await expect(page.locator("form").first().locator("button[type=submit]")).toBeVisible();
  });

  test("unauthenticated user is redirected from dashboard", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForURL(/\/(login|api\/auth)/);
    expect(page.url()).toContain("login");
  });

  test("signup page renders", async ({ page }) => {
    await page.goto("/signup");
    await expect(page.locator("input[name=name]")).toBeVisible();
    await expect(page.locator("input[name=email]")).toBeVisible();
  });
});
