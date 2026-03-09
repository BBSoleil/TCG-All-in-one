import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getCollectionById, matchAndImportCards } from "@/features/collection/services";
import { parseCSV } from "@/features/collection/services/csv-import";

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

  const importResult = await matchAndImportCards(
    id,
    collectionResult.data.gameType,
    rows,
    errors,
  );

  if (!importResult.success) {
    return NextResponse.json({ error: importResult.error.message }, { status: 500 });
  }

  return NextResponse.json(importResult.data);
}
