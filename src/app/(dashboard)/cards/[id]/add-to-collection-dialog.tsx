"use client";

import { useState, useEffect, useTransition } from "react";
import Link from "next/link";
import { getUserCollections } from "@/features/collection/actions/get-user-collections";
import { addCard } from "@/features/collection/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { CARD_CONDITIONS } from "@/shared/constants";

export function AddToCollectionDialog({
  cardId,
  cardName,
  gameType,
}: {
  cardId: string;
  cardName: string;
  gameType: string;
}) {
  const [open, setOpen] = useState(false);
  const [allCollections, setAllCollections] = useState<
    { id: string; name: string; gameType: string }[]
  >([]);
  const [selectedCollection, setSelectedCollection] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [condition, setCondition] = useState("Near Mint");
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ kind: "success" | "error"; text: string } | null>(null);

  // Filter to only collections matching THIS card's gameType — adding a Pokemon
  // card to a Yu-Gi-Oh collection makes no sense and the underlying schema
  // doesn't enforce it.
  const collections = allCollections.filter((c) => c.gameType === gameType);

  useEffect(() => {
    if (open) {
      getUserCollections().then((all) => {
        setAllCollections(all);
        // Auto-select if only one matching collection — saves a click.
        const matching = all.filter((c) => c.gameType === gameType);
        if (matching.length === 1) setSelectedCollection(matching[0]!.id);
      });
    } else {
      // Reset on close so the next open is fresh.
      setMessage(null);
      setSelectedCollection("");
    }
  }, [open, gameType]);

  function handleSubmit() {
    if (!selectedCollection) {
      setMessage({ kind: "error", text: "Please select a collection first." });
      return;
    }
    const formData = new FormData();
    formData.set("collectionId", selectedCollection);
    formData.set("cardId", cardId);
    formData.set("quantity", quantity);
    formData.set("condition", condition);

    startTransition(async () => {
      const result = await addCard({}, formData);
      if (result.success) {
        setMessage({ kind: "success", text: `Added ${cardName} to collection` });
        setTimeout(() => setOpen(false), 900);
      } else {
        setMessage({ kind: "error", text: result.error ?? "Failed to add card" });
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="secondary">Add to Collection</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add to Collection</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {allCollections.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No collections yet.{" "}
              <Link href="/collection" className="text-primary underline">
                Create one
              </Link>{" "}
              first.
            </p>
          ) : collections.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              You have no {gameType} collections.{" "}
              <Link href="/collection" className="text-primary underline">
                Create one
              </Link>{" "}
              for this game first.
            </p>
          ) : (
            <>
              <Select value={selectedCollection} onValueChange={setSelectedCollection}>
                <SelectTrigger>
                  <SelectValue placeholder="Select collection" />
                </SelectTrigger>
                <SelectContent>
                  {collections.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="flex gap-2">
                <Input
                  type="number"
                  min={1}
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="Qty"
                  className="w-20"
                />
                <Select value={condition} onValueChange={setCondition}>
                  <SelectTrigger className="flex-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CARD_CONDITIONS.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button
                onClick={handleSubmit}
                disabled={isPending}
                className="w-full"
              >
                {isPending ? "Adding..." : "Add to Collection"}
              </Button>
            </>
          )}

          {message && (
            <p
              className={`text-center text-sm ${
                message.kind === "success"
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-destructive"
              }`}
            >
              {message.text}
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
