import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { getSetProgress } from "@/features/cards/services/set-progress";
import { CardImage } from "@/shared/components";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { GAME_LABELS } from "@/shared/types";
import type { GameType } from "@/shared/types";
import { GAME_BADGE_CLASSES } from "@/shared/constants";
import { formatPrice } from "@/shared/lib/format";
import { LanguageFilter } from "./language-filter";

const VALID_GAMES = new Set<string>(["POKEMON", "YUGIOH", "MTG", "ONEPIECE"]);

export async function generateMetadata({
  params,
}: {
  params: Promise<{ gameType: string; setName: string }>;
}): Promise<Metadata> {
  const { gameType, setName } = await params;
  const decoded = decodeURIComponent(setName);
  return {
    title: `${decoded} | TCG All-in-One`,
    description: `Track your progress on the ${decoded} set. See which cards you own, which you're missing, and the total set value.`,
  };
}

export default async function SetProgressPage({
  params,
  searchParams,
}: {
  params: Promise<{ gameType: string; setName: string }>;
  searchParams: Promise<{ lang?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { gameType: rawGame, setName: rawSet } = await params;
  const { lang } = await searchParams;
  const gameType = rawGame.toUpperCase();
  if (!VALID_GAMES.has(gameType)) notFound();
  const setName = decodeURIComponent(rawSet);
  const language = lang && lang !== "ALL" ? lang.toUpperCase() : null;

  const result = await getSetProgress(
    session.user.id,
    gameType as GameType,
    setName,
    language,
  );
  if (!result.success || result.data.totalCards === 0) notFound();

  const progress = result.data;
  const gameLabel = GAME_LABELS[progress.gameType];
  const isComplete = progress.completionPct === 100;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <Link
          href={`/cards?gameType=${gameType}`}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          &larr; All {gameLabel} sets
        </Link>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
            {progress.setName}
          </h1>
          {progress.setCode && (
            <Badge variant="outline" className="font-mono">
              {progress.setCode}
            </Badge>
          )}
          <Badge variant="secondary" className={GAME_BADGE_CLASSES[progress.gameType] ?? ""}>
            {gameLabel}
          </Badge>
          {isComplete && (
            <Badge className="bg-emerald-500/20 text-emerald-200 border-emerald-500/40">
              Complete
            </Badge>
          )}
        </div>
      </div>

      {progress.availableLanguages.length > 0 && (
        <LanguageFilter
          available={progress.availableLanguages}
          active={progress.language}
          basePath={`/sets/${progress.gameType}/${encodeURIComponent(progress.setName)}`}
        />
      )}

      <Card>
        <CardHeader>
          <CardTitle>
            Your progress
            {progress.language && (
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                · {progress.language} only
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-baseline gap-6">
            <div>
              <p className="text-3xl font-bold">{progress.completionPct}%</p>
              <p className="text-xs text-muted-foreground">
                {progress.uniqueOwned} of {progress.totalCards} unique cards
              </p>
            </div>
            <div>
              <p className="text-xl font-semibold">{progress.totalOwnedCopies}</p>
              <p className="text-xs text-muted-foreground">total copies owned</p>
            </div>
            <div>
              <p className="text-xl font-semibold text-primary">
                {formatPrice(progress.estimatedValueOwned)}
              </p>
              <p className="text-xs text-muted-foreground">
                set value owned · {formatPrice(progress.estimatedValueTotal)} full set
              </p>
            </div>
          </div>
          <div className="h-3 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full bg-primary transition-all"
              style={{ width: `${progress.completionPct}%` }}
            />
          </div>
        </CardContent>
      </Card>

      <div>
        <h2 className="mb-3 text-lg font-semibold">
          Cards{" "}
          <span className="text-sm font-normal text-muted-foreground">
            ({progress.totalCards})
          </span>
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {progress.cards.map((card) => {
            const owned = card.ownedQuantity > 0;
            return (
              <Link
                key={card.id}
                href={`/cards/${card.id}`}
                className={`group relative overflow-hidden rounded-lg border transition-colors ${
                  owned
                    ? "border-primary/40 bg-card hover:border-primary"
                    : "border-border bg-card/60 hover:border-muted-foreground"
                }`}
                title={`${card.name}${card.setCode ? ` (${card.setCode})` : ""}`}
              >
                <div className={owned ? "" : "opacity-40 grayscale"}>
                  <CardImage
                    src={card.imageUrl}
                    alt={card.name}
                    gameType={progress.gameType}
                    rarity={card.rarity}
                    size="large"
                  />
                </div>
                {owned && (
                  <div className="absolute right-1.5 top-1.5 rounded-full bg-primary px-1.5 py-0.5 text-xs font-bold text-primary-foreground">
                    ×{card.ownedQuantity}
                  </div>
                )}
                <div className="p-2">
                  <p className="truncate text-xs font-medium group-hover:text-primary">
                    {card.name}
                  </p>
                  <div className="mt-0.5 flex items-center justify-between text-xs text-muted-foreground">
                    <span className="font-mono">{card.setCode ?? ""}</span>
                    {card.marketPrice !== null && <span>{formatPrice(card.marketPrice)}</span>}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {!isComplete && (
        <div className="rounded-lg border border-dashed border-border p-4 text-center">
          <p className="text-sm text-muted-foreground">
            Still {progress.totalCards - progress.uniqueOwned} card
            {progress.totalCards - progress.uniqueOwned !== 1 ? "s" : ""} to go.
          </p>
          <Link href={`/market?gameType=${gameType}`}>
            <Button variant="outline" size="sm" className="mt-2">
              Find missing cards on marketplace
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}
