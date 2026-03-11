"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { addPurchasedCardToCollectionAction } from "../actions/offer-actions";
import { addCardToDeckAction } from "@/features/decks/actions/deck-actions";
import { FolderPlus, Layers } from "lucide-react";

interface PostPurchaseActionsProps {
  cardId: string;
  cardGameType: string;
  collections: { id: string; name: string; gameType: string }[];
  decks: { id: string; name: string; gameType: string }[];
}

export function PostPurchaseActions({
  cardId,
  cardGameType,
  collections,
  decks,
}: PostPurchaseActionsProps) {
  const matchingCollections = collections.filter((c) => c.gameType === cardGameType);
  const matchingDecks = decks.filter((d) => d.gameType === cardGameType);

  return (
    <div className="flex items-center gap-1">
      <CollectionPicker
        cardId={cardId}
        collections={matchingCollections}
      />
      <DeckPicker
        cardId={cardId}
        decks={matchingDecks}
      />
    </div>
  );
}

function CollectionPicker({
  cardId,
  collections,
}: {
  cardId: string;
  collections: { id: string; name: string }[];
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  function handleAdd(collectionId: string) {
    setStatus("idle");
    startTransition(async () => {
      const result = await addPurchasedCardToCollectionAction(collectionId, cardId);
      if (result.error) {
        setStatus("error");
        setErrorMsg(result.error);
      } else {
        setStatus("success");
        setOpen(false);
      }
    });
  }

  if (status === "success") {
    return (
      <span className="text-xs text-green-500 font-medium px-2">Added!</span>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-7 text-xs gap-1">
          <FolderPlus className="h-3 w-3" />
          Collection
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-48 p-1" align="end">
        {collections.length === 0 ? (
          <p className="text-xs text-muted-foreground p-2">
            No matching collections
          </p>
        ) : (
          <div className="flex flex-col gap-0.5">
            {collections.map((c) => (
              <button
                key={c.id}
                onClick={() => handleAdd(c.id)}
                disabled={isPending}
                className="text-left text-xs px-2 py-1.5 rounded hover:bg-accent disabled:opacity-50 truncate"
              >
                {c.name}
              </button>
            ))}
          </div>
        )}
        {status === "error" && (
          <p className="text-xs text-destructive p-2">{errorMsg}</p>
        )}
      </PopoverContent>
    </Popover>
  );
}

function DeckPicker({
  cardId,
  decks,
}: {
  cardId: string;
  decks: { id: string; name: string }[];
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  function handleAdd(deckId: string) {
    setStatus("idle");
    startTransition(async () => {
      const result = await addCardToDeckAction(deckId, cardId, 1, false);
      if (result.error) {
        setStatus("error");
        setErrorMsg(result.error);
      } else {
        setStatus("success");
        setOpen(false);
      }
    });
  }

  if (status === "success") {
    return (
      <span className="text-xs text-green-500 font-medium px-2">Added!</span>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-7 text-xs gap-1">
          <Layers className="h-3 w-3" />
          Deck
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-48 p-1" align="end">
        {decks.length === 0 ? (
          <p className="text-xs text-muted-foreground p-2">
            No matching decks
          </p>
        ) : (
          <div className="flex flex-col gap-0.5">
            {decks.map((d) => (
              <button
                key={d.id}
                onClick={() => handleAdd(d.id)}
                disabled={isPending}
                className="text-left text-xs px-2 py-1.5 rounded hover:bg-accent disabled:opacity-50 truncate"
              >
                {d.name}
              </button>
            ))}
          </div>
        )}
        {status === "error" && (
          <p className="text-xs text-destructive p-2">{errorMsg}</p>
        )}
      </PopoverContent>
    </Popover>
  );
}
