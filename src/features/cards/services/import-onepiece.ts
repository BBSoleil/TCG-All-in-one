import { prisma } from "@/shared/lib/prisma";
import type { Rarity as PrismaRarity } from "@/generated/prisma/client";
import type { Result } from "@/shared/types";

interface OnePieceApiCard {
  card_name: string;
  card_set_id: string;
  set_id: string;
  set_name: string;
  rarity: string;
  card_color: string;
  card_type: string;
  card_cost: string | null;
  card_power: string | null;
  counter_amount: number | null;
  attribute: string | null;
  card_image: string;
  market_price: number | null;
}

const RARITY_MAP: Record<string, PrismaRarity> = {
  "C": "COMMON",
  "UC": "UNCOMMON",
  "R": "RARE",
  "SR": "SUPER_RARE",
  "SEC": "SECRET_RARE",
  "L": "SPECIAL",
  "SP": "SPECIAL",
  "P": "SPECIAL",
  "TR": "SPECIAL",
};

function mapRarity(rarity: string | undefined): PrismaRarity {
  if (!rarity) return "COMMON";
  return RARITY_MAP[rarity] ?? "RARE";
}

async function upsertOnePieceCards(
  cards: OnePieceApiCard[],
): Promise<number> {
  let imported = 0;

  for (const card of cards) {
    const cost = card.card_cost ? parseInt(card.card_cost, 10) || null : null;
    const power = card.card_power ? parseInt(card.card_power, 10) || null : null;

    await prisma.card.upsert({
      where: { id: `onepiece-${card.card_set_id}` },
      create: {
        id: `onepiece-${card.card_set_id}`,
        externalId: card.card_set_id,
        name: card.card_name,
        gameType: "ONEPIECE",
        setName: card.set_name,
        setCode: card.set_id,
        rarity: mapRarity(card.rarity),
        imageUrl: card.card_image,
        marketPrice: card.market_price,
        onepieceDetails: {
          create: {
            color: card.card_color ?? null,
            cost: cost,
            power: power,
            counter: card.counter_amount ?? null,
            attribute: card.attribute ?? null,
            cardType: card.card_type ?? null,
          },
        },
      },
      update: {
        name: card.card_name,
        imageUrl: card.card_image,
        marketPrice: card.market_price,
        rarity: mapRarity(card.rarity),
      },
    });
    imported++;
  }

  return imported;
}

export async function importOnePieceCards(
  setId: string,
): Promise<Result<{ imported: number }>> {
  try {
    const url = `https://optcgapi.com/api/sets/${encodeURIComponent(setId)}/`;
    const response = await fetch(url);
    if (!response.ok) {
      return { success: false, error: new Error(`OPTCG API error: ${response.status}`) };
    }

    const cards = (await response.json()) as OnePieceApiCard[];
    const imported = await upsertOnePieceCards(cards);

    return { success: true, data: { imported } };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error : new Error("One Piece import failed") };
  }
}

export async function importOnePieceStarterDecks(): Promise<
  Result<{ imported: number }>
> {
  try {
    const response = await fetch("https://optcgapi.com/api/allSTCards/");
    if (!response.ok) {
      return { success: false, error: new Error(`OPTCG API error: ${response.status}`) };
    }

    const cards = (await response.json()) as OnePieceApiCard[];
    const imported = await upsertOnePieceCards(cards);

    return { success: true, data: { imported } };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error : new Error("One Piece starter deck import failed") };
  }
}

export async function fetchOnePieceSets(): Promise<
  Result<{ id: string; name: string }[]>
> {
  try {
    const response = await fetch("https://optcgapi.com/api/allSets/");
    if (!response.ok) {
      return { success: false, error: new Error(`OPTCG API error: ${response.status}`) };
    }
    const json = (await response.json()) as { set_id: string; set_name: string }[];
    return {
      success: true,
      data: json.map((s) => ({ id: s.set_id, name: s.set_name })),
    };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error : new Error("Failed to fetch One Piece sets") };
  }
}
