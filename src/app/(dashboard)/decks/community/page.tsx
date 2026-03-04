import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { getPublicDecks } from "@/features/decks/services/decks";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { GAME_LABELS } from "@/shared/types";
import { CopyDeckButton } from "./copy-deck-button";

export const metadata: Metadata = {
  title: "Community Decks | TCG All-in-One",
  description: "Browse and copy decks shared by the community.",
};

export default async function CommunityDecksPage({
  searchParams,
}: {
  searchParams: Promise<{ game?: string; q?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { game, q } = await searchParams;
  const result = await getPublicDecks(game, q);
  const decks = result.success ? result.data : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/decks">
          <Button variant="ghost" size="sm">
            &larr; Back to My Decks
          </Button>
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-bold tracking-tight">Community Decks</h1>
        <p className="text-muted-foreground">
          Browse public decks shared by other collectors.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Link href="/decks/community">
          <Button variant={!game ? "default" : "outline"} size="sm">
            All
          </Button>
        </Link>
        {Object.entries(GAME_LABELS).map(([key, label]) => (
          <Link key={key} href={`/decks/community?game=${key}`}>
            <Button variant={game === key ? "default" : "outline"} size="sm">
              {label}
            </Button>
          </Link>
        ))}
      </div>

      {decks.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              No public decks found. Be the first to share a deck!
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {decks.map((deck) => (
            <Card key={deck.id}>
              <CardContent className="flex items-center justify-between py-3">
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/decks/${deck.id}`}
                    className="text-sm font-medium hover:underline"
                  >
                    {deck.name}
                  </Link>
                  <div className="mt-1 flex items-center gap-2">
                    <Badge variant="secondary">
                      {GAME_LABELS[deck.gameType] ?? deck.gameType}
                    </Badge>
                    {deck.format && (
                      <Badge variant="outline">
                        {deck.format.split("-").pop()}
                      </Badge>
                    )}
                    <span className="text-xs text-muted-foreground">
                      {deck.cardCount} card{deck.cardCount !== 1 ? "s" : ""}
                    </span>
                  </div>
                </div>
                <CopyDeckButton deckId={deck.id} />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
