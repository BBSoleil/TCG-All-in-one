import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getUserCollections } from "@/features/collection/services";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await getUserCollections(session.user.id);
  if (!result.success) {
    return NextResponse.json({ error: "Failed to fetch collections" }, { status: 500 });
  }

  return NextResponse.json(
    {
      collections: result.data.map((c) => ({
        ...c,
        createdAt: c.createdAt.toISOString(),
        updatedAt: c.updatedAt.toISOString(),
      })),
    },
    {
      headers: {
        "Cache-Control": "private, s-maxage=30, stale-while-revalidate=120",
      },
    },
  );
}
