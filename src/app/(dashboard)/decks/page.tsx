import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { getUserDecks } from "@/features/decks/services/decks";
import { CreateDeckDialog, DeckList } from "@/features/decks/components";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "My Decks | TCG All-in-One",
  description: "Build and manage your TCG decks with format validation.",
};

export default async function DecksPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const result = await getUserDecks(session.user.id);
  const decks = result.success ? result.data : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Decks</h1>
          <p className="text-muted-foreground">
            Build and manage decks for all supported games.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/decks/community">
            <Button variant="outline">Community Decks</Button>
          </Link>
          <CreateDeckDialog />
        </div>
      </div>

      <DeckList decks={decks} />
    </div>
  );
}
