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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export function AddToCollectionPopover({
  cardId,
  children,
}: {
  cardId: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [collections, setCollections] = useState<
    { id: string; name: string; gameType: string }[]
  >([]);
  const [selectedCollection, setSelectedCollection] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [isPending, startTransition] = useTransition();
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (open) {
      getUserCollections().then(setCollections);
      setDone(false);
    }
  }, [open]);

  function handleSubmit(e: React.MouseEvent) {
    e.stopPropagation();
    e.preventDefault();
    if (!selectedCollection) return;
    const formData = new FormData();
    formData.set("collectionId", selectedCollection);
    formData.set("cardId", cardId);
    formData.set("quantity", quantity);
    formData.set("condition", "Near Mint");

    startTransition(async () => {
      await addCard({}, formData);
      setDone(true);
      setTimeout(() => setOpen(false), 800);
    });
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent
        className="w-56 p-3"
        onClick={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
      >
        {done ? (
          <p className="text-center text-xs text-emerald-600 dark:text-emerald-400">Added!</p>
        ) : collections.length === 0 ? (
          <p className="text-xs text-muted-foreground">No collections yet</p>
        ) : (
          <div className="space-y-2">
            <Select value={selectedCollection} onValueChange={setSelectedCollection}>
              <SelectTrigger className="h-8 text-xs" aria-label="Select collection">
                <SelectValue placeholder="Collection" />
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
                className="h-8 w-16 text-xs"
                onClick={(e) => e.stopPropagation()}
                aria-label="Quantity"
              />
              <Button
                size="sm"
                className="h-8 flex-1 text-xs"
                disabled={!selectedCollection || isPending}
                onClick={handleSubmit}
              >
                {isPending ? "..." : "Add"}
              </Button>
            </div>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
