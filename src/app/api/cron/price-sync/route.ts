import { NextResponse } from "next/server";
import { syncAllPrices } from "@/features/cards/services/price-sync";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env["CRON_SECRET"];

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await syncAllPrices();

  return NextResponse.json({
    success: true,
    updated: result.updated,
    errors: result.errors,
  });
}
