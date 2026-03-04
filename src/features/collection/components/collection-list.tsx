"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { deleteCollection } from "@/features/collection/actions/delete-collection";
import { GAME_LABELS } from "@/shared/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GAME_COLORS } from "@/shared/constants";
import { ConfirmDialog } from "@/shared/components";
import { EmptyState } from "@/shared/components";
import type { CollectionWithStats } from "@/features/collection/services";

export function CollectionList({
  collections,
}: {
  collections: CollectionWithStats[];
}) {
  const router = useRouter();

  if (collections.length === 0) {
    return (
      <EmptyState
        title="No collections yet"
        description="Create your first collection to get started."
        action={{ label: "Browse cards", href: "/cards" }}
      />
    );
  }

  async function handleDelete(id: string) {
    const result = await deleteCollection(id);
    if (!result.error) {
      router.refresh();
    }
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {collections.map((collection) => (
        <div
          key={collection.id}
          className="group rounded-lg border border-border bg-card p-6 transition-colors hover:border-primary/50"
        >
          <div className="flex items-start justify-between">
            <div>
              <div
                className={`mb-3 h-1.5 w-10 rounded-full ${GAME_COLORS[collection.gameType] ?? "bg-gray-500"}`}
              />
              <Link
                href={`/collection/${collection.id}`}
                className="font-semibold hover:underline"
              >
                {collection.name}
              </Link>
              <div className="mt-1 flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">
                  {GAME_LABELS[collection.gameType as keyof typeof GAME_LABELS] ?? collection.gameType}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {collection._count.cards} card{collection._count.cards !== 1 ? "s" : ""}
                </span>
              </div>
            </div>
            <ConfirmDialog
              title="Delete collection?"
              description={`This will permanently delete "${collection.name}" and remove all cards from it.`}
              confirmLabel="Delete"
              onConfirm={() => handleDelete(collection.id)}
            >
              <Button
                variant="ghost"
                size="xs"
                className="sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
              >
                Delete
              </Button>
            </ConfirmDialog>
          </div>
        </div>
      ))}
    </div>
  );
}
