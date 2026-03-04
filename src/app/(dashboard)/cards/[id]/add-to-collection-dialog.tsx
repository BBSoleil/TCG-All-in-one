"use client";

import { useState, useEffect, useTransition } from "react";
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
}: {
  cardId: string;
  cardName: string;
}) {
  const [open, setOpen] = useState(false);
  const [collections, setCollections] = useState<
    { id: string; name: string; gameType: string }[]
  >([]);
  const [selectedCollection, setSelectedCollection] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [condition, setCondition] = useState("Near Mint");
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (open) {
      getUserCollections().then(setCollections);
    }
  }, [open]);

  function handleSubmit() {
    if (!selectedCollection) return;
    const formData = new FormData();
    formData.set("collectionId", selectedCollection);
    formData.set("cardId", cardId);
    formData.set("quantity", quantity);
    formData.set("condition", condition);

    startTransition(async () => {
      const result = await addCard({ }, formData);
      if (result.success) {
        setMessage(`Added ${cardName} to collection!`);
        setTimeout(() => setOpen(false), 1000);
      } else {
        setMessage(result.error ?? "Failed to add card");
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
          {collections.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No collections found. Create one first.
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
                disabled={!selectedCollection || isPending}
                className="w-full"
              >
                {isPending ? "Adding..." : "Add to Collection"}
              </Button>
            </>
          )}

          {message && (
            <p className="text-center text-sm text-muted-foreground">{message}</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
