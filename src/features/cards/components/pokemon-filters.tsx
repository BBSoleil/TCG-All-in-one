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

const POKEMON_TYPES = [
  "Colorless", "Darkness", "Dragon", "Fairy", "Fighting",
  "Fire", "Grass", "Lightning", "Metal", "Psychic", "Water",
];

const POKEMON_STAGES = ["Basic", "Stage 1", "Stage 2", "VMAX", "VSTAR", "ex", "GX", "EX"];

export function PokemonFilters() {
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
      <span className="text-xs font-medium text-muted-foreground">Pokemon:</span>
      <Select
        defaultValue={searchParams.get("pokemonType") ?? "all"}
        onValueChange={(v) => updateParam("pokemonType", v)}
      >
        <SelectTrigger className="h-8 w-[130px] text-xs">
          <SelectValue placeholder="Type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All types</SelectItem>
          {POKEMON_TYPES.map((t) => (
            <SelectItem key={t} value={t}>{t}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        defaultValue={searchParams.get("pokemonStage") ?? "all"}
        onValueChange={(v) => updateParam("pokemonStage", v)}
      >
        <SelectTrigger className="h-8 w-[120px] text-xs">
          <SelectValue placeholder="Stage" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All stages</SelectItem>
          {POKEMON_STAGES.map((s) => (
            <SelectItem key={s} value={s}>{s}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="flex items-center gap-1">
        <span className="text-xs text-muted-foreground">HP:</span>
        <Input
          type="number"
          placeholder="Min"
          className="h-8 w-[70px] text-xs"
          defaultValue={searchParams.get("pokemonHpMin") ?? ""}
          onBlur={(e) => updateParam("pokemonHpMin", e.target.value)}
        />
        <span className="text-xs text-muted-foreground">-</span>
        <Input
          type="number"
          placeholder="Max"
          className="h-8 w-[70px] text-xs"
          defaultValue={searchParams.get("pokemonHpMax") ?? ""}
          onBlur={(e) => updateParam("pokemonHpMax", e.target.value)}
        />
      </div>
    </div>
  );
}
