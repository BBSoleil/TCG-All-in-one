import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getSavedSearches } from "@/features/cards/services/saved-searches";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json([]);
  }
  const result = await getSavedSearches(session.user.id);
  return NextResponse.json(result.success ? result.data : []);
}
