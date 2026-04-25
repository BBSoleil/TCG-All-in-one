import { NextResponse } from "next/server";
import { expireStaleOffers } from "@/features/market/services/offer-expiry";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env["CRON_SECRET"];

  if (!cronSecret) {
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
  }
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await expireStaleOffers();

  if (!result.success) {
    return NextResponse.json(
      { error: result.error.message },
      { status: 500 },
    );
  }

  return NextResponse.json({
    success: true,
    expired: result.data.expired,
  });
}
