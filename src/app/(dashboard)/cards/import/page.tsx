import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ImportPokemonSection } from "./import-pokemon-section";
import { ImportYugiohSection } from "./import-yugioh-section";
import { ImportMtgSection } from "./import-mtg-section";
import { ImportOnePieceSection } from "./import-onepiece-section";

export const metadata: Metadata = {
  title: "Import Cards | TCG All-in-One",
  description: "Import cards from Pokemon, Yu-Gi-Oh!, Magic: The Gathering, and One Piece APIs.",
};

export default function ImportCardsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/cards">
          <Button variant="ghost" size="sm">
            &larr; Back to browser
          </Button>
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-bold tracking-tight">Import Cards</h1>
        <p className="text-muted-foreground">
          Fetch cards from external APIs to populate your database.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-4">
        <ImportPokemonSection />
        <ImportYugiohSection />
        <ImportMtgSection />
        <ImportOnePieceSection />
      </div>
    </div>
  );
}
