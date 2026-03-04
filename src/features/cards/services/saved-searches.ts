import { prisma } from "@/shared/lib/prisma";
import type { Result } from "@/shared/types";

export interface SavedSearchItem {
  id: string;
  name: string;
  filters: string;
  createdAt: Date;
}

export async function getSavedSearches(
  userId: string,
): Promise<Result<SavedSearchItem[]>> {
  try {
    const searches = await prisma.savedSearch.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      select: { id: true, name: true, filters: true, createdAt: true },
    });
    return { success: true, data: searches };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error : new Error("Failed to fetch saved searches"),
    };
  }
}

export async function createSavedSearch(
  userId: string,
  name: string,
  filters: string,
): Promise<Result<{ id: string }>> {
  try {
    // Limit to 20 saved searches per user
    const count = await prisma.savedSearch.count({ where: { userId } });
    if (count >= 20) {
      return { success: false, error: new Error("Maximum of 20 saved searches reached") };
    }

    const search = await prisma.savedSearch.create({
      data: { userId, name, filters },
      select: { id: true },
    });
    return { success: true, data: search };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error : new Error("Failed to save search"),
    };
  }
}

export async function deleteSavedSearch(
  id: string,
  userId: string,
): Promise<Result<void>> {
  try {
    const existing = await prisma.savedSearch.findFirst({
      where: { id, userId },
    });
    if (!existing) {
      return { success: false, error: new Error("Saved search not found") };
    }
    await prisma.savedSearch.delete({ where: { id } });
    return { success: true, data: undefined };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error : new Error("Failed to delete saved search"),
    };
  }
}
