import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getCollectionById, getCollectionCards } from "@/features/collection/services";
import { getSetCompletion } from "@/features/collection/services/stats";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const pageParam = request.nextUrl.searchParams.get("page");
  const page = Math.max(1, Number(pageParam) || 1);

  // Fetch collection first to get gameType for set completion
  const collectionResult = await getCollectionById(id, session.user.id);
  if (!collectionResult.success) {
    return NextResponse.json({ error: "Collection not found" }, { status: 404 });
  }

  const collection = collectionResult.data;

  // Parallel fetch: cards + set completion (no sequential dependency)
  const [cardsResult, completionResult] = await Promise.all([
    getCollectionCards(id, session.user.id, page),
    getSetCompletion(id, session.user.id, collection.gameType),
  ]);

  const cardsData = cardsResult.success
    ? cardsResult.data
    : { cards: [], total: 0, page: 1, totalPages: 1, collectionValue: 0 };
  const completion = completionResult.success ? completionResult.data : [];

  return NextResponse.json(
    {
      collection: {
        ...collection,
        createdAt: collection.createdAt.toISOString(),
        updatedAt: collection.updatedAt.toISOString(),
      },
      cards: cardsData.cards.map((c) => ({
        ...c,
        addedAt: c.addedAt.toISOString(),
      })),
      total: cardsData.total,
      page: cardsData.page,
      totalPages: cardsData.totalPages,
      collectionValue: cardsData.collectionValue,
      completion,
    },
    {
      headers: {
        "Cache-Control": "private, s-maxage=30, stale-while-revalidate=300",
      },
    },
  );
}
