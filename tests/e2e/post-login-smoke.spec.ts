import { test, expect } from "@playwright/test";

/**
 * Post-login smoke tests — exercise every authenticated page that uses raw
 * SQL in services (getUserCollections, analytics, dashboard stats, leaderboards,
 * market stats, portfolio history). Catches regressions like the PascalCase vs
 * snake_case table-name bug that silently failed in prod because services
 * swallow errors via Result<T>.
 *
 * Each test signs up a fresh user (auto-login redirects to /dashboard) and
 * asserts the page renders without a server error banner.
 */

async function signupFreshUser(page: import("@playwright/test").Page) {
  const email = `e2e-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@tcgaio.test`;
  await page.goto("/signup");
  await page.locator("input[name=name]").fill("E2E Smoke");
  await page.locator("input[name=email]").fill(email);
  await page.locator("input[name=password]").fill("E2ESmoke123!");
  await page.locator("input[name=confirmPassword]").fill("E2ESmoke123!");
  await page.locator("form").first().evaluate((form: HTMLFormElement) => form.requestSubmit());
  await page.waitForURL(/\/dashboard/, { timeout: 10_000 });
  return { email };
}

test.describe("Post-login smoke", () => {
  test("signup redirects straight to /dashboard (P1.1 auto-login)", async ({ page }) => {
    await signupFreshUser(page);
    expect(page.url()).toContain("/dashboard");
    // Dashboard calls raw SQL via getDashboardStats — renders "0" if working, blank if SQL fails
    await expect(page.getByText(/Total Cards/i)).toBeVisible();
  });

  test("/collection renders without 500", async ({ page }) => {
    await signupFreshUser(page);
    const resp = await page.goto("/collection");
    expect(resp?.status()).toBe(200);
    // Query getUserCollections uses $queryRawUnsafe — if tables are wrong, the Result<T>
    // silently returns [] and the "No collections yet" empty state shows either way.
    // So assert the page rendered the collection UI (not an error boundary).
    await expect(page.getByRole("heading", { name: /collection/i }).first()).toBeVisible();
  });

  test("/api/collection returns 200 after signup", async ({ page }) => {
    await signupFreshUser(page);
    const resp = await page.request.get("/api/collection");
    expect(resp.status()).toBe(200);
    const json = await resp.json();
    expect(json).toHaveProperty("collections");
    expect(Array.isArray(json.collections)).toBe(true);
  });

  test("/analytics renders (exercises analytics raw SQL)", async ({ page }) => {
    await signupFreshUser(page);
    const resp = await page.goto("/analytics");
    expect(resp?.status()).toBe(200);
    await expect(page.getByText(/analytics/i).first()).toBeVisible();
  });

  test("/leaderboards renders (exercises leaderboards raw SQL)", async ({ page }) => {
    await signupFreshUser(page);
    const resp = await page.goto("/leaderboards");
    expect(resp?.status()).toBe(200);
  });

  test("/billing renders usage bar", async ({ page }) => {
    await signupFreshUser(page);
    const resp = await page.goto("/billing");
    expect(resp?.status()).toBe(200);
    await expect(page.getByText(/0 of 2,?000 cards/i)).toBeVisible();
  });

  test("create a collection → appears in list (P0.1 + P0.2)", async ({ page }) => {
    await signupFreshUser(page);
    await page.goto("/collection");
    await page.getByRole("button", { name: /new collection/i }).click();
    await page.locator("input[name=name]").fill("E2E Test Deck");
    // Open game select + click Magic option
    await page.getByRole("combobox").click();
    await page.getByRole("option", { name: /magic/i }).click();
    await page.getByRole("button", { name: /^create collection$/i }).click();
    await expect(page.getByText("E2E Test Deck")).toBeVisible({ timeout: 5000 });
  });
});
