"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { addCardToDeckAction, getUserDecksAction } from "@/features/decks/actions";

type DeckOption = { id: string; name: string; gameType: string };

export function AddToDeckDialog({
  cardId,
  cardName,
  gameType,
}: {
  cardId: string;
  cardName: string;
  gameType: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [decks, setDecks] = useState<DeckOption[]>([]);
  const [deckId, setDeckId] = useState<string>("");
  const [quantity, setQuantity] = useState(1);
  const [isSideboard, setIsSideboard] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!open) return;
    setIsLoading(true);
    getUserDecksAction()
      .then((all) => {
        const filtered = all.filter((d) => d.gameType === gameType);
        setDecks(filtered);
        if (filtered[0]) setDeckId(filtered[0].id);
      })
      .finally(() => setIsLoading(false));
  }, [open, gameType]);

  function handleAdd() {
    if (!deckId) return;
    startTransition(async () => {
      try {
        const result = await addCardToDeckAction(deckId, cardId, quantity, isSideboard);
        if (result.error) {
          toast.error(result.error);
          return;
        }
        toast.success(`Added ${quantity}x ${cardName} to deck`);
        setOpen(false);
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Something went wrong";
        toast.error(msg);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">Add to deck</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add to deck</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading your decks...</p>
        ) : decks.length === 0 ? (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              You don't have any {gameType} decks yet.
            </p>
            <Button onClick={() => router.push("/decks")}>Create a deck</Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="deck">Deck</Label>
              <Select value={deckId} onValueChange={setDeckId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select deck" />
                </SelectTrigger>
                <SelectContent>
                  {decks.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end gap-3">
              <div className="space-y-2">
                <Label htmlFor="qty">Quantity</Label>
                <Input
                  id="qty"
                  type="number"
                  min={1}
                  max={99}
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  className="w-24"
                />
              </div>
              <label className="flex items-center gap-2 pb-2 text-sm">
                <input
                  type="checkbox"
                  checked={isSideboard}
                  onChange={(e) => setIsSideboard(e.target.checked)}
                />
                Sideboard
              </label>
            </div>

            <Button onClick={handleAdd} disabled={isPending} className="w-full">
              {isPending ? "Adding..." : "Add to deck"}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
