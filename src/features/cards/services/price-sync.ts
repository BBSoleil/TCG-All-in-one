import { prisma } from "@/shared/lib/prisma";
import { recordPriceSnapshots } from "./price-history";

const BATCH_SIZE = 100;

interface PriceUpdate {
  id: string;
  price: number;
}

export async function syncAllPrices(): Promise<{
  updated: number;
  errors: string[];
}> {
  const errors: string[] = [];
  let updated = 0;

  const games = ["POKEMON", "YUGIOH", "MTG", "ONEPIECE"] as const;

  for (const game of games) {
    try {
      const count = await syncGamePrices(game);
      updated += count;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(`${game}: ${msg}`);
    }
  }

  return { updated, errors };
}

async function syncGamePrices(
  game: "POKEMON" | "YUGIOH" | "MTG" | "ONEPIECE",
): Promise<number> {
  switch (game) {
    case "POKEMON":
      return syncPokemonPrices();
    case "YUGIOH":
      return syncYugiohPrices();
    case "MTG":
      return syncMtgPrices();
    case "ONEPIECE":
      return syncOnepiecePrices();
  }
}

async function syncPokemonPrices(): Promise<number> {
  const cards = await prisma.card.findMany({
    where: { gameType: "POKEMON" },
    select: { id: true, externalId: true },
  });

  const updates: PriceUpdate[] = [];
  // Process in batches of card IDs
  const externalIds = cards
    .map((c) => ({ id: c.id, extId: c.externalId }))
    .filter((c): c is { id: string; extId: string } => c.extId !== null);

  for (let i = 0; i < externalIds.length; i += BATCH_SIZE) {
    const batch = externalIds.slice(i, i + BATCH_SIZE);
    const idQuery = batch.map((c) => `id:${c.extId}`).join(" OR ");

    const res = await fetch(
      `https://api.pokemontcg.io/v2/cards?q=${encodeURIComponent(idQuery)}&select=id,cardmarket`,
      { headers: { "X-Api-Key": process.env["POKEMON_TCG_API_KEY"] ?? "" } },
    );
    if (!res.ok) continue;

    const json = (await res.json()) as {
      data: { id: string; cardmarket?: { prices?: { averageSellPrice?: number } } }[];
    };

    for (const apiCard of json.data) {
      const price = apiCard.cardmarket?.prices?.averageSellPrice;
      if (price && price > 0) {
        const dbCard = batch.find((c) => c.extId === apiCard.id);
        if (dbCard) updates.push({ id: dbCard.id, price });
      }
    }

    // Rate limit: ~300ms between batches
    await delay(300);
  }

  return applyPriceUpdates(updates);
}

async function syncYugiohPrices(): Promise<number> {
  const updates: PriceUpdate[] = [];
  let offset = 0;
  const limit = 500;

  // YGOProDeck returns all cards with prices in paginated form
  while (true) {
    const res = await fetch(
      `https://db.ygoprodeck.com/api/v7/cardinfo.php?num=${limit}&offset=${offset}`,
    );
    if (!res.ok) break;

    const json = (await res.json()) as {
      data: {
        id: number;
        card_prices?: { tcgplayer_price?: string }[];
      }[];
    };

    if (!json.data || json.data.length === 0) break;

    // Map external IDs to DB IDs in bulk
    const extIds = json.data.map((c) => `yugioh-${c.id}`);
    const dbCards = await prisma.card.findMany({
      where: { id: { in: extIds } },
      select: { id: true },
    });
    const dbIdSet = new Set(dbCards.map((c) => c.id));

    for (const card of json.data) {
      const priceStr = card.card_prices?.[0]?.tcgplayer_price;
      const price = priceStr ? parseFloat(priceStr) : 0;
      const dbId = `yugioh-${card.id}`;
      if (price > 0 && dbIdSet.has(dbId)) {
        updates.push({ id: dbId, price });
      }
    }

    offset += limit;
    await delay(200);
  }

  return applyPriceUpdates(updates);
}

async function syncMtgPrices(): Promise<number> {
  const updates: PriceUpdate[] = [];
  const url =
    "https://api.scryfall.com/bulk-data/default-cards";

  // Use Scryfall bulk data endpoint for efficiency
  const bulkRes = await fetch(url);
  if (!bulkRes.ok) return 0;

  const bulkJson = (await bulkRes.json()) as { download_uri: string };
  const downloadRes = await fetch(bulkJson.download_uri);
  if (!downloadRes.ok) return 0;

  const allCards = (await downloadRes.json()) as {
    id: string;
    prices: { usd?: string | null };
  }[];

  // Get all MTG card IDs from DB
  const dbCards = await prisma.card.findMany({
    where: { gameType: "MTG" },
    select: { id: true, externalId: true },
  });
  const extToDbId = new Map<string, string>();
  for (const c of dbCards) {
    if (c.externalId) extToDbId.set(c.externalId, c.id);
  }

  for (const card of allCards) {
    const price = card.prices.usd ? parseFloat(card.prices.usd) : 0;
    const dbId = extToDbId.get(card.id);
    if (price > 0 && dbId) {
      updates.push({ id: dbId, price });
    }
  }

  return applyPriceUpdates(updates);
}

async function syncOnepiecePrices(): Promise<number> {
  const res = await fetch("https://optcgapi.com/api/allCards/");
  if (!res.ok) return 0;

  const apiCards = (await res.json()) as {
    id: string;
    set_id: string;
    market_price?: number | null;
  }[];

  const dbCards = await prisma.card.findMany({
    where: { gameType: "ONEPIECE" },
    select: { id: true, externalId: true },
  });
  const extToDbId = new Map<string, string>();
  for (const c of dbCards) {
    if (c.externalId) extToDbId.set(c.externalId, c.id);
  }

  const updates: PriceUpdate[] = [];
  for (const card of apiCards) {
    const extId = `${card.id}_${card.set_id}`;
    const dbId = extToDbId.get(extId);
    if (card.market_price && card.market_price > 0 && dbId) {
      updates.push({ id: dbId, price: card.market_price });
    }
  }

  return applyPriceUpdates(updates);
}

async function applyPriceUpdates(updates: PriceUpdate[]): Promise<number> {
  if (updates.length === 0) return 0;

  // Batch update using raw SQL for performance
  for (let i = 0; i < updates.length; i += BATCH_SIZE) {
    const batch = updates.slice(i, i + BATCH_SIZE);
    const cases = batch
      .map((u) => `WHEN '${u.id}' THEN ${u.price}`)
      .join(" ");
    const ids = batch.map((u) => `'${u.id}'`).join(",");

    await prisma.$executeRawUnsafe(`
      UPDATE "Card"
      SET "marketPrice" = CASE id ${cases} END,
          "updatedAt" = NOW()
      WHERE id IN (${ids})
    `);
  }

  // Record price history snapshots
  await recordPriceSnapshots(
    updates.map((u) => ({ cardId: u.id, price: u.price })),
  );

  return updates.length;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
