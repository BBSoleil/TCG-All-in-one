import { test, expect } from "@playwright/test";

test.describe("CSV Export API", () => {
  test("export endpoint returns 401 for unauthenticated requests", async ({ request }) => {
    const response = await request.get("/api/collection/fake-id/export");
    expect(response.status()).toBe(401);
  });
});
