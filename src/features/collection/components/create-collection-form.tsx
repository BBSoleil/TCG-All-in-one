"use client";

import { useActionState } from "react";
import { toast } from "sonner";
import { createCollection } from "@/features/collection/actions/create-collection";
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

const GAMES = [
  { value: "POKEMON", label: "Pokemon TCG" },
  { value: "YUGIOH", label: "Yu-Gi-Oh!" },
  { value: "MTG", label: "Magic: The Gathering" },
  { value: "ONEPIECE", label: "One Piece Card Game" },
];

const initialState: CollectionActionState = {};

export function CreateCollectionForm({ onSuccess }: { onSuccess?: () => void }) {
  const [state, formAction, isPending] = useActionState(
    async (prev: CollectionActionState, formData: FormData) => {
      try {
        const result = await createCollection(prev, formData);
        if (result.success) {
          toast.success("Collection created!");
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
      <div className="space-y-2">
        <Label htmlFor="name">Collection name</Label>
        <Input id="name" name="name" placeholder="My Pokemon cards" required />
        {state.fieldErrors?.name && (
          <p className="text-sm text-destructive">{state.fieldErrors.name[0]}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="gameType">Game</Label>
        <Select name="gameType" required>
          <SelectTrigger>
            <SelectValue placeholder="Select a game" />
          </SelectTrigger>
          <SelectContent>
            {GAMES.map((game) => (
              <SelectItem key={game.value} value={game.value}>
                {game.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {state.fieldErrors?.gameType && (
          <p className="text-sm text-destructive">{state.fieldErrors.gameType[0]}</p>
        )}
      </div>

      {state.error && (
        <p className="text-sm text-destructive">{state.error}</p>
      )}

      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? "Creating..." : "Create collection"}
      </Button>
    </form>
  );
}
