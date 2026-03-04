"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createListingAction, searchCardsForListing } from "../actions";

const CONDITIONS = [
  "Mint",
  "Near Mint",
  "Lightly Played",
  "Moderately Played",
  "Heavily Played",
  "Damaged",
];

interface CardOption {
  id: string;
  name: string;
  gameType: string;
  setName: string | null;
}

export function CreateListingForm() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<CardOption[]>([]);
  const [selected, setSelected] = useState<CardOption | null>(null);
  const [isSearching, startSearch] = useTransition();
  const [isSubmitting, startSubmit] = useTransition();
  const [error, setError] = useState("");

  function handleSearch() {
    if (!search.trim()) return;
    startSearch(async () => {
      const cards = await searchCardsForListing(search.trim());
      setResults(cards);
    });
  }

  function handleSubmit(formData: FormData) {
    if (!selected) return;
    formData.set("cardId", selected.id);
    startSubmit(async () => {
      const result = await createListingAction(formData);
      if (result.error) {
        setError(result.error);
      } else {
        router.push("/market");
      }
    });
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      <div>
        <Label>Card</Label>
        {selected ? (
          <div className="flex items-center justify-between rounded-md border border-input p-2">
            <span className="text-sm font-medium">{selected.name}</span>
            <Button type="button" variant="ghost" size="sm" onClick={() => { setSelected(null); setResults([]); }}>
              Change
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex gap-2">
              <Input
                placeholder="Search for a card..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleSearch())}
                aria-label="Search cards to list"
              />
              <Button type="button" onClick={handleSearch} disabled={isSearching || !search.trim()}>
                {isSearching ? "..." : "Search"}
              </Button>
            </div>
            {results.length > 0 && (
              <div className="max-h-48 overflow-y-auto rounded border border-input">
                {results.map((card) => (
                  <button
                    key={card.id}
                    type="button"
                    onClick={() => setSelected(card)}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-muted"
                  >
                    <span className="font-medium">{card.name}</span>
                    {card.setName && <span className="text-xs text-muted-foreground">({card.setName})</span>}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="listing-price">Price ($)</Label>
          <Input id="listing-price" name="price" type="number" step="0.01" min="0" defaultValue="0" />
        </div>
        <div>
          <Label htmlFor="listing-quantity">Quantity</Label>
          <Input id="listing-quantity" name="quantity" type="number" min="1" defaultValue="1" />
        </div>
      </div>

      <div>
        <Label htmlFor="listing-condition">Condition</Label>
        <select
          id="listing-condition"
          name="condition"
          required
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          {CONDITIONS.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      <div>
        <Label htmlFor="listing-description">Description (optional)</Label>
        <Input id="listing-description" name="description" placeholder="Any additional details..." />
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="isTradeOnly" value="true" />
        Trade only (no cash offers)
      </label>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button type="submit" disabled={isSubmitting || !selected}>
        {isSubmitting ? "Creating..." : "Create Listing"}
      </Button>
    </form>
  );
}
