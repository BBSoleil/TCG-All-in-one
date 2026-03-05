import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { getCollectionById, getCollectionCards, getSetCompletion } from "@/features/collection/services";
import { CollectionCardList, ExportCSVButton, ImportCSVButton } from "@/features/collection/components";
import { CollectionVisibilityToggle } from "@/features/social/components";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { GAME_LABELS } from "@/shared/types";
import { formatPrice } from "@/shared/lib/format";
import { AddCardDialog } from "./add-card-dialog";

export default async function CollectionDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { id } = await params;
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);

  const collectionResult = await getCollectionById(id, session.user.id);
  if (!collectionResult.success) notFound();

  const collection = collectionResult.data;

  const [cardsResult, completionResult] = await Promise.all([
    getCollectionCards(id, session.user.id, page),
    getSetCompletion(id, session.user.id),
  ]);
  const cardsData = cardsResult.success
    ? cardsResult.data
    : { cards: [], total: 0, page: 1, totalPages: 1, collectionValue: 0 };
  const completion = completionResult.success ? completionResult.data : [];

  const collectionValue = cardsData.collectionValue;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/collection">
          <Button variant="ghost" size="sm">
            &larr; Back
          </Button>
        </Link>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {collection.name}
          </h1>
          <div className="mt-1 flex items-center gap-2">
            <Badge variant="secondary">
              {GAME_LABELS[collection.gameType as keyof typeof GAME_LABELS] ?? collection.gameType}
            </Badge>
            <span className="text-sm text-muted-foreground">
              {collection._count.cards} card{collection._count.cards !== 1 ? "s" : ""}
            </span>
            {collectionValue > 0 && (
              <span className="text-sm font-medium">
                {formatPrice(collectionValue)}
              </span>
            )}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <ImportCSVButton collectionId={id} />
          <ExportCSVButton collectionId={id} />
          <CollectionVisibilityToggle
            collectionId={id}
            isPublic={collection.isPublic}
          />
          <AddCardDialog
            collectionId={id}
            gameType={collection.gameType}
          />
        </div>
      </div>

      {completion.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Set Completion</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {completion.map((set) => {
                const pct = Math.round((set.owned / set.total) * 100);
                return (
                  <div key={set.setName}>
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{set.setName}</span>
                      <span className="text-muted-foreground">
                        {set.owned}/{set.total} ({pct}%)
                      </span>
                    </div>
                    <div className="mt-1 h-2 w-full rounded-full bg-muted">
                      <div
                        className="h-2 rounded-full bg-primary transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      <CollectionCardList cards={cardsData.cards} collectionId={id} />

      {cardsData.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          {page > 1 && (
            <Link href={`/collection/${id}?page=${page - 1}`}>
              <Button variant="outline" size="sm">&larr; Previous</Button>
            </Link>
          )}
          <span className="text-sm text-muted-foreground">
            Page {page} of {cardsData.totalPages} ({cardsData.total} cards)
          </span>
          {page < cardsData.totalPages && (
            <Link href={`/collection/${id}?page=${page + 1}`}>
              <Button variant="outline" size="sm">Next &rarr;</Button>
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
