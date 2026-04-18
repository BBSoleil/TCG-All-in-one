import { test, expect } from "@playwright/test";

// /market is behind middleware matcher — unauthenticated users get redirected
// to /login. Authenticated-user flow is not covered here (no seeded listings in
// the CI DB); it's reserved for a separate integration test.
test.describe("Marketplace", () => {
  test("market page redirects unauthenticated users to login", async ({ page }) => {
    await page.goto("/market");
    await page.waitForURL(/\/login/);
    expect(page.url()).toContain("login");
  });
});
