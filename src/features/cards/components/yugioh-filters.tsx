"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const CARD_TYPES = ["Monster", "Spell", "Trap"];
const ATTRIBUTES = ["DARK", "DIVINE", "EARTH", "FIRE", "LIGHT", "WATER", "WIND"];
const RACES = [
  "Aqua", "Beast", "Beast-Warrior", "Cyberse", "Dinosaur", "Divine-Beast",
  "Dragon", "Fairy", "Fiend", "Fish", "Insect", "Machine", "Plant",
  "Psychic", "Pyro", "Reptile", "Rock", "Sea Serpent", "Spellcaster",
  "Thunder", "Warrior", "Winged Beast", "Wyrm", "Zombie",
];
const LEVELS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

export function YugiohFilters() {
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
      <span className="text-xs font-medium text-muted-foreground">Yu-Gi-Oh!:</span>
      <Select
        defaultValue={searchParams.get("yugiohCardType") ?? "all"}
        onValueChange={(v) => updateParam("yugiohCardType", v)}
      >
        <SelectTrigger className="h-8 w-[120px] text-xs">
          <SelectValue placeholder="Card Type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All types</SelectItem>
          {CARD_TYPES.map((t) => (
            <SelectItem key={t} value={t}>{t}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        defaultValue={searchParams.get("yugiohAttribute") ?? "all"}
        onValueChange={(v) => updateParam("yugiohAttribute", v)}
      >
        <SelectTrigger className="h-8 w-[120px] text-xs">
          <SelectValue placeholder="Attribute" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All attributes</SelectItem>
          {ATTRIBUTES.map((a) => (
            <SelectItem key={a} value={a}>{a}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        defaultValue={searchParams.get("yugiohLevel") ?? "all"}
        onValueChange={(v) => updateParam("yugiohLevel", v)}
      >
        <SelectTrigger className="h-8 w-[100px] text-xs">
          <SelectValue placeholder="Level" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All levels</SelectItem>
          {LEVELS.map((l) => (
            <SelectItem key={l} value={String(l)}>Level {l}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        defaultValue={searchParams.get("yugiohRace") ?? "all"}
        onValueChange={(v) => updateParam("yugiohRace", v)}
      >
        <SelectTrigger className="h-8 w-[140px] text-xs">
          <SelectValue placeholder="Race" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All races</SelectItem>
          {RACES.map((r) => (
            <SelectItem key={r} value={r}>{r}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
