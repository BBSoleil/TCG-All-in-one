import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { getDeckById } from "@/features/decks/services/decks";
import { getFormatById } from "@/features/decks/services/formats";
import { DeckCardList, AddCardToDeck, DeckAnalysisPanel } from "@/features/decks/components";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GAME_LABELS } from "@/shared/types";
import { GAME_BADGE_CLASSES } from "@/shared/constants";
import { DeckSettings } from "./deck-settings";

export default async function DeckDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { id } = await params;
  const result = await getDeckById(id, session.user.id);
  if (!result.success) notFound();

  const deck = result.data;
  const isOwner = deck.userId === session.user.id;
  const format = deck.format ? getFormatById(deck.format) : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/decks">
          <Button variant="ghost" size="sm">
            &larr; Back
          </Button>
        </Link>
      </div>

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{deck.name}</h1>
          {deck.description && (
            <p className="mt-1 text-sm text-muted-foreground">
              {deck.description}
            </p>
          )}
          <div className="mt-2 flex items-center gap-2">
            <Badge variant="secondary" className={GAME_BADGE_CLASSES[deck.gameType] ?? ""}>
              {GAME_LABELS[deck.gameType] ?? deck.gameType}
            </Badge>
            {format && <Badge variant="outline">{format.name}</Badge>}
            {deck.isPublic && <Badge variant="outline">Public</Badge>}
            <span className="text-sm text-muted-foreground">
              {deck.cardCount} card{deck.cardCount !== 1 ? "s" : ""}
            </span>
            {format && (
              <span className="text-xs text-muted-foreground">
                (min {format.minDeckSize}, max {format.maxDeckSize}, {format.maxCopies} copies)
              </span>
            )}
          </div>
        </div>
        {isOwner && (
          <div className="flex items-center gap-2">
            <DeckSettings deckId={id} isPublic={deck.isPublic} />
            <AddCardToDeck deckId={id} gameType={deck.gameType} />
          </div>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_350px]">
        <DeckCardList cards={deck.cards} isOwner={isOwner} />
        <div>
          <DeckAnalysisPanel deckId={id} />
        </div>
      </div>
    </div>
  );
}
