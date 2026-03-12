"use client";

import { useActionState } from "react";
import { toast } from "sonner";
import { addCard } from "@/features/collection/actions/add-card";
import { CONDITION_OPTIONS } from "@/features/collection/schemas";
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

export function AddCardToCollectionForm({
  collectionId,
  cards,
  onSuccess,
}: {
  collectionId: string;
  cards: { id: string; name: string }[];
  onSuccess?: () => void;
}) {
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

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="collectionId" value={collectionId} />

      <div className="space-y-2">
        <Label htmlFor="cardId">Card</Label>
        <Select name="cardId" required>
          <SelectTrigger>
            <SelectValue placeholder="Select a card" />
          </SelectTrigger>
          <SelectContent>
            {cards.map((card) => (
              <SelectItem key={card.id} value={card.id}>
                {card.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
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

      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? "Adding..." : "Add card"}
      </Button>
    </form>
  );
}
