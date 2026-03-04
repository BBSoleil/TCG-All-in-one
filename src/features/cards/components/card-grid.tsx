import { Search } from "lucide-react";
import { EmptyState } from "@/shared/components";
import type { CardListItem } from "@/features/cards/types";
import { CardGridTile } from "./card-grid-tile";

export function CardGrid({ cards }: { cards: CardListItem[] }) {
  if (cards.length === 0) {
    return (
      <EmptyState
        icon={Search}
        title="No cards found"
        description="Try adjusting your search or filters."
      />
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {cards.map((card) => (
        <CardGridTile key={card.id} card={card} />
      ))}
    </div>
  );
}
