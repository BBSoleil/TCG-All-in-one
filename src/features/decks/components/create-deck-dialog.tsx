"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GAME_LABELS } from "@/shared/types";
import { createDeckAction } from "../actions";
import { getFormatsForGame } from "../services/formats";

export function CreateDeckDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [gameType, setGameType] = useState("");

  const formats = gameType ? getFormatsForGame(gameType) : [];

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await createDeckAction(formData);
      if (result.error) {
        setError(result.error);
      } else if (result.id) {
        setOpen(false);
        setError("");
        setGameType("");
        router.push(`/decks/${result.id}`);
      }
    });
  }

  if (!open) {
    return (
      <Button onClick={() => setOpen(true)}>New Deck</Button>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <h3 className="mb-3 text-sm font-medium">Create Deck</h3>
      <form action={handleSubmit} className="space-y-3">
        <div>
          <Label htmlFor="deck-name">Name</Label>
          <Input id="deck-name" name="name" placeholder="My Deck" required />
        </div>
        <div>
          <Label htmlFor="deck-game">Game</Label>
          <select
            id="deck-game"
            name="gameType"
            value={gameType}
            onChange={(e) => setGameType(e.target.value)}
            required
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="">Select game...</option>
            {Object.entries(GAME_LABELS).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </div>
        {formats.length > 0 && (
          <div>
            <Label htmlFor="deck-format">Format (optional)</Label>
            <select
              id="deck-format"
              name="format"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">No format</option>
              {formats.map((f) => (
                <option key={f.id} value={f.id}>{f.name}</option>
              ))}
            </select>
          </div>
        )}
        <div>
          <Label htmlFor="deck-desc">Description (optional)</Label>
          <Input id="deck-desc" name="description" placeholder="Deck description..." />
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <div className="flex gap-2">
          <Button type="submit" disabled={isPending}>
            {isPending ? "Creating..." : "Create"}
          </Button>
          <Button type="button" variant="outline" onClick={() => { setOpen(false); setError(""); }}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
