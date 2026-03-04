import { test, expect } from "@playwright/test";

test.describe("Deck Builder", () => {
  test("decks page redirects unauthenticated users", async ({ page }) => {
    await page.goto("/decks");
    await page.waitForURL(/\/(login|api\/auth)/);
    expect(page.url()).toContain("login");
  });

  test("community decks page redirects unauthenticated users", async ({ page }) => {
    await page.goto("/decks/community");
    await page.waitForURL(/\/(login|api\/auth)/);
    expect(page.url()).toContain("login");
  });
});
