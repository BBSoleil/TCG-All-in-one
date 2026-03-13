import { NextResponse } from "next/server";
import { auth } from "@/auth";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE = 4.5 * 1024 * 1024; // 4.5MB

// Magic byte signatures for file type validation
const MAGIC_BYTES: Record<string, number[]> = {
  "image/jpeg": [0xff, 0xd8, 0xff],
  "image/png": [0x89, 0x50, 0x4e, 0x47],
  "image/webp": [0x52, 0x49, 0x46, 0x46], // RIFF header
};

function validateMagicBytes(buffer: ArrayBuffer, contentType: string): boolean {
  const expected = MAGIC_BYTES[contentType];
  if (!expected) return false;
  const bytes = new Uint8Array(buffer).slice(0, expected.length);
  return expected.every((byte, i) => bytes[i] === byte);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json(
      { error: "Invalid file type. Allowed: JPEG, PNG, WebP" },
      { status: 400 },
    );
  }

  if (file.size > MAX_SIZE) {
    return NextResponse.json(
      { error: "File must be under 4.5MB" },
      { status: 400 },
    );
  }

  const buffer = await file.arrayBuffer();
  if (!validateMagicBytes(buffer, file.type)) {
    return NextResponse.json(
      { error: "Invalid image file" },
      { status: 400 },
    );
  }

  try {
    const { put } = await import("@vercel/blob");
    const blob = await put(
      `listings/${session.user.id}/${Date.now()}-${file.name}`,
      file,
      { access: "public" },
    );
    return NextResponse.json({ url: blob.url });
  } catch (error) {
    console.error("[upload] Photo upload failed:", error);
    return NextResponse.json(
      { error: "Photo upload failed. Please try again." },
      { status: 500 },
    );
  }
}
