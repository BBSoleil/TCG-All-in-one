import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/shared/lib/prisma";
import { getCollectionById } from "@/features/collection/services";
import { parseCSV } from "@/features/collection/services/csv-import";
import type { GameType as PrismaGameType } from "@/generated/prisma/client";

export async function POST(
  request: Request,
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

  const formData = await request.formData();
  const file = formData.get("file");

  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
  }

  if (file.size > 2 * 1024 * 1024) {
    return NextResponse.json({ error: "File too large (max 2MB)" }, { status: 400 });
  }

  const content = await file.text();
  const parseResult = parseCSV(content);

  if (!parseResult.success) {
    return NextResponse.json({ error: parseResult.error.message }, { status: 400 });
  }

  const { rows, errors } = parseResult.data;

  if (rows.length === 0) {
    return NextResponse.json({ error: "No valid rows found", parseErrors: errors }, { status: 400 });
  }

  // Match card names to DB cards (by name + game type)
  const gameType = collectionResult.data.gameType as PrismaGameType;
  const cardNames = [...new Set(rows.map((r) => r.name))];

  const matchedCards = await prisma.card.findMany({
    where: {
      gameType,
      name: { in: cardNames, mode: "insensitive" },
    },
    select: { id: true, name: true },
  });

  // Build name -> card ID map (case-insensitive)
  const nameToId = new Map<string, string>();
  for (const card of matchedCards) {
    nameToId.set(card.name.toLowerCase(), card.id);
  }

  let imported = 0;
  const importErrors: string[] = [...errors];

  for (const row of rows) {
    const cardId = nameToId.get(row.name.toLowerCase());
    if (!cardId) {
      importErrors.push(`Card not found: "${row.name}"`);
      continue;
    }

    await prisma.collectionCard.upsert({
      where: { collectionId_cardId: { collectionId: id, cardId } },
      create: {
        collectionId: id,
        cardId,
        quantity: row.quantity,
        condition: row.condition,
        notes: row.notes,
      },
      update: {
        quantity: row.quantity,
        condition: row.condition,
        notes: row.notes,
      },
    });
    imported++;
  }

  return NextResponse.json({
    imported,
    total: rows.length,
    errors: importErrors,
  });
}
