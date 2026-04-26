"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { addCard } from "@/features/collection/actions/add-card";
import { fetchCardsForSelect } from "@/features/cards/actions";
import { CONDITION_OPTIONS, LANGUAGE_OPTIONS } from "@/features/collection/schemas";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { CollectionActionState } from "@/features/collection/types";

const initialState: CollectionActionState = {};

interface CardOption {
  id: string;
  name: string;
  setName: string | null;
  setCode: string | null;
  rarity: string | null;
}

function formatCardLabel(card: CardOption): string {
  const set = card.setCode ? `${card.setName ?? ""} ${card.setCode}`.trim() : card.setName ?? "";
  const rarity = card.rarity ? ` · ${card.rarity}` : "";
  return set ? `${card.name} — ${set}${rarity}` : `${card.name}${rarity}`;
}

export function AddCardToCollectionForm({
  collectionId,
  gameType,
  onSuccess,
}: {
  collectionId: string;
  gameType: string;
  onSuccess?: () => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<CardOption[]>([]);
  const [selectedCardId, setSelectedCardId] = useState("");
  const [isSearching, startSearch] = useTransition();

  const [state, formAction, isPending] = useActionState(
    async (prev: CollectionActionState, formData: FormData) => {
      try {
        const result = await addCard(prev, formData);
        if (result.success) {
          toast.success("Card added!");
          onSuccess?.();
        } else if (result.error) {
          toast.error(result.error);
        }
        return result;
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Something went wrong";
        toast.error(msg);
        return { error: msg };
      }
    },
    initialState,
  );

  // Debounced server search — fetches up to 50 matches per query, with set + rarity
  // so duplicate-named cards across sets are distinguishable.
  useEffect(() => {
    const handle = setTimeout(() => {
      startSearch(async () => {
        const data = await fetchCardsForSelect(gameType, query);
        setResults(data);
      });
    }, 200);
    return () => clearTimeout(handle);
  }, [query, gameType]);

  const selected = results.find((c) => c.id === selectedCardId);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="collectionId" value={collectionId} />
      <input type="hidden" name="cardId" value={selectedCardId} />

      <div className="space-y-2">
        <Label htmlFor="card-search">Search for a card</Label>
        <Input
          id="card-search"
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setSelectedCardId("");
          }}
          placeholder="Type a card name (e.g. Charizard, Blue-Eyes...)"
          autoComplete="off"
        />
        {isSearching && (
          <p className="text-xs text-muted-foreground">Searching…</p>
        )}
        {!isSearching && results.length === 0 && query.length > 0 && (
          <p className="text-xs text-muted-foreground">No cards match.</p>
        )}
        {results.length > 0 && (
          <div className="max-h-56 overflow-y-auto rounded-md border border-border bg-card">
            {results.map((card) => (
              <button
                type="button"
                key={card.id}
                onClick={() => setSelectedCardId(card.id)}
                className={`block w-full px-3 py-2 text-left text-sm hover:bg-muted ${
                  selectedCardId === card.id ? "bg-primary/20" : ""
                }`}
              >
                {formatCardLabel(card)}
              </button>
            ))}
          </div>
        )}
        {selected && (
          <p className="text-xs text-emerald-600 dark:text-emerald-400">
            Selected: {formatCardLabel(selected)}
          </p>
        )}
        {state.fieldErrors?.cardId && (
          <p className="text-sm text-destructive">{state.fieldErrors.cardId[0]}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="quantity">Quantity</Label>
        <Input
          id="quantity"
          name="quantity"
          type="number"
          min={1}
          defaultValue={1}
          required
        />
        {state.fieldErrors?.quantity && (
          <p className="text-sm text-destructive">{state.fieldErrors.quantity[0]}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="condition">Condition</Label>
        <Select name="condition">
          <SelectTrigger>
            <SelectValue placeholder="Select condition (optional)" />
          </SelectTrigger>
          <SelectContent>
            {CONDITION_OPTIONS.map((cond) => (
              <SelectItem key={cond} value={cond}>
                {cond}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="language">Language</Label>
        <Select name="language" defaultValue="EN">
          <SelectTrigger>
            <SelectValue placeholder="Select language" />
          </SelectTrigger>
          <SelectContent>
            {LANGUAGE_OPTIONS.map((lang) => (
              <SelectItem key={lang} value={lang}>
                {lang}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="foil"
          name="foil"
          value="true"
          className="h-4 w-4 rounded border-gray-600 bg-gray-800 text-purple-500 focus:ring-purple-500"
        />
        <Label htmlFor="foil">Foil / Holographic</Label>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="acquiredPrice">Acquired Price</Label>
          <Input
            id="acquiredPrice"
            name="acquiredPrice"
            type="number"
            step="0.01"
            min={0}
            placeholder="e.g. 12.50"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="acquiredAt">Acquired Date</Label>
          <Input
            id="acquiredAt"
            name="acquiredAt"
            type="date"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Input id="notes" name="notes" placeholder="Optional notes" />
      </div>

      {state.error && state.error.startsWith("UPGRADE_REQUIRED:") ? (
        <div className="rounded-md border border-purple-500/30 bg-purple-500/10 p-3 text-sm">
          <p className="text-purple-300">{state.error.replace("UPGRADE_REQUIRED:", "")}</p>
          <Link
            href="/profile"
            className="mt-2 inline-block text-xs font-semibold text-purple-400 underline hover:text-purple-300"
          >
            Upgrade to Master →
          </Link>
        </div>
      ) : state.error ? (
        <p className="text-sm text-destructive">{state.error}</p>
      ) : null}

      <Button type="submit" className="w-full" disabled={isPending || !selectedCardId}>
        {isPending ? "Adding..." : selectedCardId ? "Add card" : "Pick a card first"}
      </Button>
    </form>
  );
}
