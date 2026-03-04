"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { addCardToDeckAction, fetchCardsForDeck } from "../actions";

interface CardOption {
  id: string;
  name: string;
  setName: string | null;
  imageUrl: string | null;
}

export function AddCardToDeck({
  deckId,
  gameType,
}: {
  deckId: string;
  gameType: string;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<CardOption[]>([]);
  const [selected, setSelected] = useState<CardOption | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [isSideboard, setIsSideboard] = useState(false);
  const [isSearching, startSearch] = useTransition();
  const [isAdding, startAdd] = useTransition();
  const [error, setError] = useState("");

  function handleSearch() {
    if (!search.trim()) return;
    startSearch(async () => {
      const cards = await fetchCardsForDeck(gameType, search.trim());
      setResults(cards);
    });
  }

  function handleAdd() {
    if (!selected) return;
    startAdd(async () => {
      const result = await addCardToDeckAction(deckId, selected.id, quantity, isSideboard);
      if (result.error) {
        setError(result.error);
      } else {
        setSelected(null);
        setQuantity(1);
        setSearch("");
        setResults([]);
        setError("");
        setOpen(false);
      }
    });
  }

  if (!open) {
    return (
      <Button size="sm" onClick={() => setOpen(true)}>
        Add Card
      </Button>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-card p-4 space-y-3">
      <h4 className="text-sm font-medium">Add Card to Deck</h4>

      <div className="flex gap-2">
        <Input
          placeholder="Search cards..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleSearch())}
          className="flex-1"
          aria-label="Search cards to add to deck"
        />
        <Button size="sm" onClick={handleSearch} disabled={isSearching || !search.trim()}>
          {isSearching ? "..." : "Search"}
        </Button>
      </div>

      {results.length > 0 && !selected && (
        <div className="max-h-48 overflow-y-auto space-y-1">
          {results.map((card) => (
            <button
              key={card.id}
              onClick={() => setSelected(card)}
              className="flex w-full items-center gap-2 rounded px-2 py-1 text-left text-sm hover:bg-muted"
            >
              <span className="truncate font-medium">{card.name}</span>
              {card.setName && (
                <span className="text-xs text-muted-foreground">({card.setName})</span>
              )}
            </button>
          ))}
        </div>
      )}

      {selected && (
        <div className="space-y-2">
          <p className="text-sm">
            Selected: <span className="font-medium">{selected.name}</span>
          </p>
          <div className="flex items-center gap-3">
            <div>
              <Label htmlFor="qty">Qty</Label>
              <Input
                id="qty"
                type="number"
                min={1}
                max={99}
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                className="w-20"
              />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={isSideboard}
                onChange={(e) => setIsSideboard(e.target.checked)}
              />
              Sideboard
            </label>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex gap-2">
            <Button size="sm" onClick={handleAdd} disabled={isAdding}>
              {isAdding ? "Adding..." : "Add"}
            </Button>
            <Button size="sm" variant="outline" onClick={() => setSelected(null)}>
              Back
            </Button>
          </div>
        </div>
      )}

      <Button size="sm" variant="ghost" onClick={() => { setOpen(false); setError(""); setSelected(null); setResults([]); }}>
        Cancel
      </Button>
    </div>
  );
}
