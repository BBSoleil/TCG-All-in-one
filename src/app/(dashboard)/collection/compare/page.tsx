import type { Metadata } from "next";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { getUserCollections } from "@/features/collection/services";
import { compareCollections } from "@/features/collection/services/comparison";
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
import type { ComparisonCard } from "@/features/collection/services/comparison";
import { CompareForm } from "./compare-form";

export const metadata: Metadata = {
  title: "Compare Collections | TCG All-in-One",
  description: "Compare two collections side by side.",
};

function CardList({ cards, label }: { cards: ComparisonCard[]; label: string }) {
  if (cards.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-4 text-center">
        No {label.toLowerCase()} cards.
      </p>
    );
  }
  return (
    <div className="space-y-1 max-h-[400px] overflow-y-auto">
      {cards.slice(0, 50).map((card) => (
        <Link
          key={card.id}
          href={`/cards/${card.id}`}
          className="flex items-center gap-2 rounded p-2 text-sm hover:bg-muted transition-colors"
        >
          {card.imageUrl ? (
            <div className="relative h-8 w-6 shrink-0 overflow-hidden rounded">
              <Image src={card.imageUrl} alt={card.name} fill sizes="24px" className="object-cover" />
            </div>
          ) : (
            <div className="flex h-8 w-6 items-center justify-center rounded bg-muted text-[10px]">?</div>
          )}
          <span className="truncate flex-1" title={card.name}>{card.name}</span>
          <Badge variant="secondary" className="text-[10px] shrink-0">
            {GAME_LABELS[card.gameType as keyof typeof GAME_LABELS] ?? card.gameType}
          </Badge>
          {card.marketPrice > 0 && (
            <span className="text-xs text-muted-foreground shrink-0">
              {formatPrice(card.marketPrice)}
            </span>
          )}
        </Link>
      ))}
      {cards.length > 50 && (
        <p className="text-xs text-muted-foreground text-center pt-2">
          ...and {cards.length - 50} more
        </p>
      )}
    </div>
  );
}

export default async function CompareCollectionsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const params = await searchParams;
  const colAId = typeof params.a === "string" ? params.a : "";
  const colBId = typeof params.b === "string" ? params.b : "";

  const collectionsResult = await getUserCollections(session.user.id);
  const collections = collectionsResult.success ? collectionsResult.data : [];

  // If both selected, show comparison
  if (colAId && colBId && colAId !== colBId) {
    const result = await compareCollections(colAId, colBId, session.user.id);

    if (!result.success) {
      return (
        <div className="space-y-6">
          <h1 className="text-2xl font-bold">Compare Collections</h1>
          <p className="text-destructive">{result.error.message}</p>
          <Link href="/collection/compare">
            <Button variant="outline">Try again</Button>
          </Link>
        </div>
      );
    }

    const { collectionA, collectionB, shared, onlyInA, onlyInB } = result.data;

    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/collection">
            <Button variant="ghost" size="sm">&larr; Back</Button>
          </Link>
          <h1 className="text-2xl font-bold">Compare Collections</h1>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">{collectionA.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{collectionA.cardCount} cards</p>
              <p className="text-sm text-muted-foreground">{formatPrice(collectionA.totalValue)} value</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">{collectionB.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{collectionB.cardCount} cards</p>
              <p className="text-sm text-muted-foreground">{formatPrice(collectionB.totalValue)} value</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Shared</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xl font-bold text-primary">{shared.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Only in {collectionA.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xl font-bold">{onlyInA.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Only in {collectionB.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xl font-bold">{onlyInB.length}</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader><CardTitle>Shared Cards ({shared.length})</CardTitle></CardHeader>
          <CardContent><CardList cards={shared} label="shared" /></CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader><CardTitle>Only in {collectionA.name} ({onlyInA.length})</CardTitle></CardHeader>
            <CardContent><CardList cards={onlyInA} label="unique" /></CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Only in {collectionB.name} ({onlyInB.length})</CardTitle></CardHeader>
            <CardContent><CardList cards={onlyInB} label="unique" /></CardContent>
          </Card>
        </div>

        <Link href="/collection/compare">
          <Button variant="outline">Compare different collections</Button>
        </Link>
      </div>
    );
  }

  // Selection UI
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/collection">
          <Button variant="ghost" size="sm">&larr; Back</Button>
        </Link>
        <h1 className="text-2xl font-bold">Compare Collections</h1>
      </div>

      {collections.length < 2 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              You need at least 2 collections to compare.
            </p>
            <Link href="/collection" className="mt-4 inline-block">
              <Button>Create collections</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Select two collections</CardTitle>
          </CardHeader>
          <CardContent>
            <CompareForm
              collections={collections}
              defaultA={colAId}
              defaultB={colBId}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
