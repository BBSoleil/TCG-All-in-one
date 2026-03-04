"use server";

import { auth } from "@/auth";
import { prisma } from "@/shared/lib/prisma";

export async function getUserCollections(): Promise<
  { id: string; name: string; gameType: string }[]
> {
  const session = await auth();
  if (!session?.user?.id) return [];

  const collections = await prisma.collection.findMany({
    where: { userId: session.user.id },
    select: { id: true, name: true, gameType: true },
    orderBy: { name: "asc" },
  });

  return collections;
}
