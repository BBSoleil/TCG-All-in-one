"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { deleteCollection } from "@/features/collection/actions/delete-collection";
import { GAME_LABELS } from "@/shared/types";
import { formatPrice } from "@/shared/lib/format";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { GAME_COLORS } from "@/shared/constants";
import { ConfirmDialog } from "@/shared/components";
import { EmptyState } from "@/shared/components";
import type { CollectionWithStats } from "@/features/collection/services";

type SortKey = "name" | "value" | "cards" | "game" | "updated";

export function CollectionList({
  collections,
}: {
  collections: CollectionWithStats[];
}) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortKey>("updated");

  const filtered = useMemo(() => {
    let result = collections;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.gameType.toLowerCase().includes(q),
      );
    }

    return [...result].sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.name.localeCompare(b.name);
        case "value":
          return (b.portfolioValue ?? 0) - (a.portfolioValue ?? 0);
        case "cards":
          return b._count.cards - a._count.cards;
        case "game":
          return a.gameType.localeCompare(b.gameType);
        case "updated":
        default:
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      }
    });
  }, [collections, search, sortBy]);

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

  const sortOptions: { key: SortKey; label: string }[] = [
    { key: "updated", label: "Recent" },
    { key: "name", label: "Name" },
    { key: "value", label: "Value" },
    { key: "cards", label: "Cards" },
    { key: "game", label: "Game" },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Input
          placeholder="Search collections..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <div className="flex items-center gap-1">
          <span className="text-xs text-muted-foreground mr-1">Sort:</span>
          {sortOptions.map((opt) => (
            <Button
              key={opt.key}
              variant={sortBy === opt.key ? "secondary" : "ghost"}
              size="xs"
              onClick={() => setSortBy(opt.key)}
            >
              {opt.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((collection) => (
          <div
            key={collection.id}
            className="group rounded-lg border border-border bg-card p-6 transition-colors hover:border-primary/50"
          >
            <div className="flex items-start justify-between">
              <div className="min-w-0 flex-1">
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
                {(collection.portfolioValue ?? 0) > 0 && (
                  <p className="mt-2 text-sm font-medium text-primary">
                    {formatPrice(collection.portfolioValue ?? 0)}
                  </p>
                )}
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
        {filtered.length === 0 && (
          <p className="col-span-full py-8 text-center text-sm text-muted-foreground">
            No collections match &ldquo;{search}&rdquo;
          </p>
        )}
      </div>
    </div>
  );
}
