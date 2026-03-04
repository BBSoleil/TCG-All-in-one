import { prisma } from "@/shared/lib/prisma";
import type { Rarity as PrismaRarity } from "@/generated/prisma/client";
import type { Result } from "@/shared/types";

interface ScryfallCard {
  id: string;
  name: string;
  mana_cost?: string;
  cmc?: number;
  colors?: string[];
  type_line?: string;
  oracle_text?: string;
  power?: string;
  toughness?: string;
  loyalty?: string | null;
  set: string;
  set_name: string;
  rarity: string;
  image_uris?: { normal: string; small: string };
  card_faces?: { image_uris?: { normal: string; small: string } }[];
  prices: { usd: string | null; usd_foil: string | null };
}

interface ScryfallResponse {
  data: ScryfallCard[];
  total_cards: number;
  has_more: boolean;
  next_page?: string;
}

const RARITY_MAP: Record<string, PrismaRarity> = {
  "common": "COMMON",
  "uncommon": "UNCOMMON",
  "rare": "RARE",
  "mythic": "ULTRA_RARE",
  "special": "SPECIAL",
  "bonus": "SPECIAL",
};

function mapRarity(rarity: string): PrismaRarity {
  return RARITY_MAP[rarity] ?? "RARE";
}

function getImageUrl(card: ScryfallCard): string | null {
  if (card.image_uris?.normal) return card.image_uris.normal;
  if (card.card_faces?.[0]?.image_uris?.normal) {
    return card.card_faces[0].image_uris.normal;
  }
  return null;
}

export async function importMtgCards(
  setCode: string,
): Promise<Result<{ imported: number }>> {
  try {
    let url: string | null =
      `https://api.scryfall.com/cards/search?q=set:${encodeURIComponent(setCode)}&order=name`;
    let imported = 0;

    while (url) {
      const response = await fetch(url);
      if (!response.ok) {
        if (response.status === 404) {
          return { success: true, data: { imported: 0 } };
        }
        return { success: false, error: new Error(`Scryfall API error: ${response.status}`) };
      }

      const json = (await response.json()) as ScryfallResponse;

      for (const card of json.data) {
        const priceStr = card.prices.usd;
        const marketPrice = priceStr ? parseFloat(priceStr) || null : null;

        await prisma.card.upsert({
          where: { id: `mtg-${card.id}` },
          create: {
            id: `mtg-${card.id}`,
            externalId: card.id,
            name: card.name,
            gameType: "MTG",
            setName: card.set_name,
            setCode: card.set,
            rarity: mapRarity(card.rarity),
            imageUrl: getImageUrl(card),
            marketPrice: marketPrice,
            mtgDetails: {
              create: {
                manaCost: card.mana_cost ?? null,
                cmc: card.cmc ?? null,
                colors: card.colors ?? [],
                typeLine: card.type_line ?? null,
                oracleText: card.oracle_text ?? null,
                power: card.power ?? null,
                toughness: card.toughness ?? null,
                loyalty: card.loyalty ?? null,
              },
            },
          },
          update: {
            name: card.name,
            imageUrl: getImageUrl(card),
            marketPrice: marketPrice,
            rarity: mapRarity(card.rarity),
          },
        });
        imported++;
      }

      // Respect Scryfall rate limit: 10 req/s
      if (json.has_more && json.next_page) {
        url = json.next_page;
        await new Promise((resolve) => setTimeout(resolve, 120));
      } else {
        url = null;
      }
    }

    return { success: true, data: { imported } };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error : new Error("MTG import failed") };
  }
}

export async function fetchMtgSets(): Promise<
  Result<{ code: string; name: string; card_count: number }[]>
> {
  try {
    const response = await fetch("https://api.scryfall.com/sets");
    if (!response.ok) {
      return { success: false, error: new Error(`Scryfall API error: ${response.status}`) };
    }
    const json = (await response.json()) as {
      data: { code: string; name: string; card_count: number; set_type: string; released_at: string }[];
    };
    // Only return expansion/core sets, sorted by release date desc
    const sets = json.data
      .filter((s) => ["expansion", "core", "masters", "draft_innovation"].includes(s.set_type))
      .sort((a, b) => b.released_at.localeCompare(a.released_at))
      .slice(0, 50)
      .map((s) => ({ code: s.code, name: s.name, card_count: s.card_count }));
    return { success: true, data: sets };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error : new Error("Failed to fetch sets") };
  }
}
