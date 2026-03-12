"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { createListingAction } from "@/features/market/actions/listing-actions";
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
import { CARD_CONDITIONS } from "@/shared/constants";

export function QuickSellPopover({
  cardId,
  children,
}: {
  cardId: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [price, setPrice] = useState("");
  const [condition, setCondition] = useState("Near Mint");
  const [isPending, startTransition] = useTransition();
  const [done, setDone] = useState(false);

  function handleSubmit(e: React.MouseEvent) {
    e.stopPropagation();
    e.preventDefault();
    if (!price || Number(price) <= 0) return;

    const formData = new FormData();
    formData.set("cardId", cardId);
    formData.set("price", price);
    formData.set("condition", condition);
    formData.set("quantity", "1");
    formData.set("isTradeOnly", "false");

    startTransition(async () => {
      try {
        const result = await createListingAction(formData);
        if (result.error) {
          toast.error(result.error);
        } else {
          toast.success("Card listed for sale!");
          setDone(true);
          setTimeout(() => setOpen(false), 800);
        }
      } catch {
        toast.error("Failed to create listing");
      }
    });
  }

  return (
    <Popover open={open} onOpenChange={(v) => { setOpen(v); setDone(false); }}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent
        className="w-56 p-3"
        onClick={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
      >
        {done ? (
          <p className="text-center text-xs text-emerald-600 dark:text-emerald-400">Listed!</p>
        ) : (
          <div className="space-y-2">
            <Input
              type="number"
              step="0.01"
              min="0.01"
              placeholder="Price ($)"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="h-8 text-xs"
              onClick={(e) => e.stopPropagation()}
              aria-label="Listing price"
            />
            <Select value={condition} onValueChange={setCondition}>
              <SelectTrigger className="h-8 text-xs" aria-label="Card condition">
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
            <Button
              size="sm"
              className="h-8 w-full text-xs"
              disabled={!price || Number(price) <= 0 || isPending}
              onClick={handleSubmit}
            >
              {isPending ? "..." : "List for Sale"}
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
