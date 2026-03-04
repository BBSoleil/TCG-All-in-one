import { test, expect } from "@playwright/test";

// These tests verify that authenticated-only pages redirect properly
// and that core navigation flows work after login.

test.describe("Authenticated Pages", () => {
  test("collection page redirects unauthenticated users", async ({ page }) => {
    await page.goto("/collection");
    await page.waitForURL(/\/(login|api\/auth)/);
    expect(page.url()).toContain("login");
  });

  test("market page redirects unauthenticated users", async ({ page }) => {
    await page.goto("/market");
    await page.waitForURL(/\/(login|api\/auth)/);
    expect(page.url()).toContain("login");
  });

  test("wishlist page redirects unauthenticated users", async ({ page }) => {
    await page.goto("/wishlist");
    await page.waitForURL(/\/(login|api\/auth)/);
    expect(page.url()).toContain("login");
  });

  test("profile page redirects unauthenticated users", async ({ page }) => {
    await page.goto("/profile");
    await page.waitForURL(/\/(login|api\/auth)/);
    expect(page.url()).toContain("login");
  });

  test("decks page redirects unauthenticated users", async ({ page }) => {
    await page.goto("/decks");
    await page.waitForURL(/\/(login|api\/auth)/);
    expect(page.url()).toContain("login");
  });

  test("leaderboards page redirects unauthenticated users", async ({ page }) => {
    await page.goto("/leaderboards");
    await page.waitForURL(/\/(login|api\/auth)/);
    expect(page.url()).toContain("login");
  });
});

test.describe("Login Flow", () => {
  test("shows validation error for empty fields", async ({ page }) => {
    await page.goto("/login");
    await page.locator("button[type=submit]").click();
    // HTML5 validation should prevent submission, or custom error shown
    const emailInput = page.locator("input[name=email]");
    const isRequired = await emailInput.getAttribute("required");
    if (isRequired !== null) {
      // Browser handles validation
      expect(await emailInput.evaluate((el) => (el as HTMLInputElement).validity.valid)).toBe(false);
    }
  });

  test("shows error for invalid credentials", async ({ page }) => {
    await page.goto("/login");
    await page.locator("input[name=email]").fill("fake@test.com");
    await page.locator("input[name=password]").fill("wrongpassword");
    await page.locator("button[type=submit]").click();
    await page.waitForTimeout(2000);
    // Should show error or remain on login page
    expect(page.url()).toContain("login");
  });
});

test.describe("Signup Flow", () => {
  test("signup page has all required fields", async ({ page }) => {
    await page.goto("/signup");
    await expect(page.locator("input[name=name]")).toBeVisible();
    await expect(page.locator("input[name=email]")).toBeVisible();
    await expect(page.locator("input[name=password]")).toBeVisible();
    await expect(page.locator("button[type=submit]")).toBeVisible();
  });

  test("signup has link back to login", async ({ page }) => {
    await page.goto("/signup");
    const loginLink = page.locator("a[href*=login]");
    await expect(loginLink).toBeVisible();
  });
});
