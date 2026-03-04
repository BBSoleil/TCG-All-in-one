import { NextResponse } from "next/server";
import { checkPriceAlerts } from "@/features/notifications/services";

export async function GET(request: Request) {
  // Verify cron secret to prevent unauthorized access
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env["CRON_SECRET"];

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await checkPriceAlerts();

  if (!result.success) {
    return NextResponse.json(
      { error: result.error.message },
      { status: 500 },
    );
  }

  return NextResponse.json({
    success: true,
    alertsSent: result.data.alertsSent,
  });
}
