import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getCollectionById, getCollectionCards } from "@/features/collection/services";
import { generateCSV } from "@/features/collection/services/csv-export";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { id } = await params;

  const collectionResult = await getCollectionById(id, session.user.id);
  if (!collectionResult.success) {
    return NextResponse.json({ error: "Collection not found" }, { status: 404 });
  }

  const cardsResult = await getCollectionCards(id, session.user.id);
  const cards = cardsResult.success ? cardsResult.data : [];

  const csv = generateCSV(cards, collectionResult.data.name);
  const filename = `${collectionResult.data.name.replace(/[^a-zA-Z0-9-_ ]/g, "")}.csv`;

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
