import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { auth } from "@/auth";

/**
 * Admin-only endpoint for verifying Sentry is wired up end-to-end.
 *
 * Usage: sign in as ADMIN_EMAIL, visit /api/admin/sentry-test
 *   - ?mode=thrown (default) — throws a regular Error, captured by Sentry
 *     via onRequestError. Response is a 500 from Next.js error handling.
 *   - ?mode=captured — calls Sentry.captureException directly so the endpoint
 *     returns 200 after logging. Useful to confirm the SDK is initialized.
 *
 * Delete this file once Sentry is confirmed flowing in production.
 */
export async function GET(request: Request) {
  const session = await auth();
  const adminEmail = process.env["ADMIN_EMAIL"];

  if (!adminEmail || !session?.user?.email || session.user.email !== adminEmail) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const url = new URL(request.url);
  const mode = url.searchParams.get("mode") ?? "thrown";
  const marker = `sentry-test-${Date.now()}`;

  if (mode === "captured") {
    Sentry.captureException(new Error(`Sentry captured-mode smoke test [${marker}]`), {
      tags: { "test.kind": "sentry-smoke", "test.marker": marker },
    });
    return NextResponse.json({
      ok: true,
      mode,
      marker,
      hint: "Search for the marker tag in Sentry Issues within a minute.",
    });
  }

  throw new Error(`Sentry thrown-mode smoke test [${marker}]`);
}
