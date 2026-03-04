"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const OP_COLORS = ["Red", "Green", "Blue", "Purple", "Black", "Yellow"];
const OP_CARD_TYPES = ["Leader", "Character", "Event", "Stage"];

export function OnepieceFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const updateParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value && value !== "all") {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      params.delete("page");
      router.push(`/cards?${params.toString()}`);
    },
    [router, searchParams],
  );

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-md border border-border bg-muted/50 p-3">
      <span className="text-xs font-medium text-muted-foreground">One Piece:</span>
      <Select
        defaultValue={searchParams.get("onepieceColor") ?? "all"}
        onValueChange={(v) => updateParam("onepieceColor", v)}
      >
        <SelectTrigger className="h-8 w-[120px] text-xs">
          <SelectValue placeholder="Color" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All colors</SelectItem>
          {OP_COLORS.map((c) => (
            <SelectItem key={c} value={c}>{c}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        defaultValue={searchParams.get("onepieceCardType") ?? "all"}
        onValueChange={(v) => updateParam("onepieceCardType", v)}
      >
        <SelectTrigger className="h-8 w-[120px] text-xs">
          <SelectValue placeholder="Card Type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All types</SelectItem>
          {OP_CARD_TYPES.map((t) => (
            <SelectItem key={t} value={t}>{t}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="flex items-center gap-1">
        <span className="text-xs text-muted-foreground">Cost:</span>
        <Input
          type="number"
          placeholder="Min"
          className="h-8 w-[70px] text-xs"
          defaultValue={searchParams.get("onepieceCostMin") ?? ""}
          onBlur={(e) => updateParam("onepieceCostMin", e.target.value)}
        />
        <span className="text-xs text-muted-foreground">-</span>
        <Input
          type="number"
          placeholder="Max"
          className="h-8 w-[70px] text-xs"
          defaultValue={searchParams.get("onepieceCostMax") ?? ""}
          onBlur={(e) => updateParam("onepieceCostMax", e.target.value)}
        />
      </div>
    </div>
  );
}
