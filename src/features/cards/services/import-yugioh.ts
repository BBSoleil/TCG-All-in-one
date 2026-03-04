import { prisma } from "@/shared/lib/prisma";
import type { Rarity as PrismaRarity } from "@/generated/prisma/client";
import type { Result } from "@/shared/types";

interface YugiohApiCard {
  id: number;
  name: string;
  type: string;
  attribute?: string;
  level?: number;
  atk?: number;
  def?: number;
  race: string;
  archetype?: string;
  card_sets?: { set_name: string; set_code: string; set_rarity: string }[];
  card_images: { image_url: string; image_url_small: string }[];
  card_prices: { tcgplayer_price: string; cardmarket_price: string }[];
}

interface YugiohApiResponse {
  data: YugiohApiCard[];
  meta?: { total_rows: number; rows_remaining: number };
}

const RARITY_MAP: Record<string, PrismaRarity> = {
  "Common": "COMMON",
  "Rare": "RARE",
  "Super Rare": "SUPER_RARE",
  "Ultra Rare": "ULTRA_RARE",
  "Secret Rare": "SECRET_RARE",
  "Ultimate Rare": "SECRET_RARE",
  "Ghost Rare": "SPECIAL",
  "Starlight Rare": "SPECIAL",
  "Short Print": "UNCOMMON",
};

function mapRarity(rarity: string | undefined): PrismaRarity {
  if (!rarity) return "COMMON";
  return RARITY_MAP[rarity] ?? "RARE";
}

function getCardType(type: string): string {
  if (type.includes("Monster")) return "Monster";
  if (type.includes("Spell")) return "Spell";
  if (type.includes("Trap")) return "Trap";
  return type;
}

export async function importYugiohCards(
  offset: number = 0,
  num: number = 50,
): Promise<Result<{ imported: number; hasMore: boolean }>> {
  try {
    const url = `https://db.ygoprodeck.com/api/v7/cardinfo.php?num=${num}&offset=${offset}`;
    const response = await fetch(url);
    if (!response.ok) {
      return { success: false, error: new Error(`YGOProDeck API error: ${response.status}`) };
    }

    const json = (await response.json()) as YugiohApiResponse;
    let imported = 0;
    const hasMore = (json.meta?.rows_remaining ?? 0) > 0;

    for (const card of json.data) {
      const setInfo = card.card_sets?.[0];
      const priceStr = card.card_prices?.[0]?.tcgplayer_price;
      const marketPrice = priceStr ? parseFloat(priceStr) || null : null;

      await prisma.card.upsert({
        where: { id: `yugioh-${card.id}` },
        create: {
          id: `yugioh-${card.id}`,
          externalId: String(card.id),
          name: card.name,
          gameType: "YUGIOH",
          setName: setInfo?.set_name ?? null,
          setCode: setInfo?.set_code ?? null,
          rarity: mapRarity(setInfo?.set_rarity),
          imageUrl: card.card_images[0]?.image_url_small ?? null,
          marketPrice: marketPrice,
          yugiohDetails: {
            create: {
              cardType: getCardType(card.type),
              attribute: card.attribute ?? null,
              level: card.level ?? null,
              attack: card.atk ?? null,
              defense: card.def ?? null,
              race: card.race ?? null,
              archetype: card.archetype ?? null,
            },
          },
        },
        update: {
          name: card.name,
          imageUrl: card.card_images[0]?.image_url_small ?? null,
          marketPrice: marketPrice,
          rarity: mapRarity(setInfo?.set_rarity),
        },
      });
      imported++;
    }

    return { success: true, data: { imported, hasMore } };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error : new Error("Yu-Gi-Oh import failed") };
  }
}
