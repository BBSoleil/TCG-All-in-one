import { prisma } from "@/shared/lib/prisma";
import type { Rarity as PrismaRarity } from "@/generated/prisma/client";
import type { Result } from "@/shared/types";

interface PokemonApiCard {
  id: string;
  name: string;
  hp?: string;
  types?: string[];
  supertype: string;
  subtypes?: string[];
  evolvesFrom?: string;
  set: { name: string; id: string };
  rarity?: string;
  images: { small: string; large: string };
  cardmarket?: { prices?: { averageSellPrice?: number } };
  weaknesses?: { type: string; value: string }[];
  retreatCost?: string[];
  resistances?: { type: string; value: string }[];
}

interface PokemonApiResponse {
  data: PokemonApiCard[];
  page: number;
  pageSize: number;
  count: number;
  totalCount: number;
}

const RARITY_MAP: Record<string, PrismaRarity> = {
  "Common": "COMMON",
  "Uncommon": "UNCOMMON",
  "Rare": "RARE",
  "Rare Holo": "RARE",
  "Rare Holo EX": "SUPER_RARE",
  "Rare Holo GX": "SUPER_RARE",
  "Rare Holo V": "SUPER_RARE",
  "Rare Ultra": "ULTRA_RARE",
  "Rare Secret": "SECRET_RARE",
  "Rare Rainbow": "SECRET_RARE",
  "Rare Shiny": "SPECIAL",
  "Amazing Rare": "SPECIAL",
  "LEGEND": "SPECIAL",
  "Promo": "SPECIAL",
};

function mapRarity(rarity: string | undefined): PrismaRarity {
  if (!rarity) return "COMMON";
  return RARITY_MAP[rarity] ?? "RARE";
}

const apiKey = process.env["POKEMON_TCG_API_KEY"];
const headers: Record<string, string> = apiKey ? { "X-Api-Key": apiKey } : {};

function getStage(subtypes?: string[]): string | null {
  if (!subtypes) return null;
  if (subtypes.includes("Basic")) return "Basic";
  if (subtypes.includes("Stage 1")) return "Stage 1";
  if (subtypes.includes("Stage 2")) return "Stage 2";
  return subtypes[0] ?? null;
}

export async function importPokemonCards(
  setId: string,
): Promise<Result<{ imported: number }>> {
  try {
    const url = `https://api.pokemontcg.io/v2/cards?q=set.id:${encodeURIComponent(setId)}&pageSize=250`;
    const response = await fetch(url, { headers });
    if (!response.ok) {
      return { success: false, error: new Error(`Pokemon API error: ${response.status}`) };
    }

    const json = (await response.json()) as PokemonApiResponse;
    let imported = 0;

    for (const card of json.data) {
      const marketPrice = card.cardmarket?.prices?.averageSellPrice ?? null;

      await prisma.card.upsert({
        where: { id: `pokemon-${card.id}` },
        create: {
          id: `pokemon-${card.id}`,
          externalId: card.id,
          name: card.name,
          gameType: "POKEMON",
          setName: card.set.name,
          setCode: card.set.id,
          rarity: mapRarity(card.rarity),
          imageUrl: card.images.large,
          marketPrice: marketPrice,
          pokemonDetails: {
            create: {
              hp: card.hp ? parseInt(card.hp, 10) || null : null,
              types: card.types ?? [],
              evolvesFrom: card.evolvesFrom ?? null,
              stage: getStage(card.subtypes),
              weakness: card.weaknesses?.[0]
                ? `${card.weaknesses[0].type} ${card.weaknesses[0].value}`
                : null,
              resistance: card.resistances?.[0]
                ? `${card.resistances[0].type} ${card.resistances[0].value}`
                : null,
              retreatCost: card.retreatCost?.length ?? null,
            },
          },
        },
        update: {
          name: card.name,
          imageUrl: card.images.large,
          marketPrice: marketPrice,
          rarity: mapRarity(card.rarity),
        },
      });
      imported++;
    }

    return { success: true, data: { imported } };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error : new Error("Pokemon import failed") };
  }
}

export async function fetchPokemonSets(): Promise<
  Result<{ id: string; name: string; total: number }[]>
> {
  try {
    const response = await fetch(
      "https://api.pokemontcg.io/v2/sets?orderBy=-releaseDate&pageSize=50",
      { headers },
    );
    if (!response.ok) {
      return { success: false, error: new Error(`Pokemon API error: ${response.status}`) };
    }
    const json = (await response.json()) as {
      data: { id: string; name: string; total: number }[];
    };
    return {
      success: true,
      data: json.data.map((s) => ({ id: s.id, name: s.name, total: s.total })),
    };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error : new Error("Failed to fetch sets") };
  }
}
