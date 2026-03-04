/**
 * Fast production seed — uses batched $transaction to minimize round-trips.
 * Run: DATABASE_URL="..." npx tsx scripts/seed-prod-fast.ts
 */

import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

function resolveConnectionString(): string {
  const raw = process.env["DATABASE_URL"];
  if (!raw) { console.error("DATABASE_URL required"); process.exit(1); }
  if (raw.startsWith("prisma+postgres://")) {
    const url = new URL(raw);
    const apiKey = url.searchParams.get("api_key");
    if (apiKey) {
      const decoded = JSON.parse(Buffer.from(apiKey, "base64").toString()) as { databaseUrl: string };
      return decoded.databaseUrl;
    }
  }
  return raw;
}

const adapter = new PrismaPg({ connectionString: resolveConnectionString() });
const prisma = new PrismaClient({ adapter });

type PrismaRarity = "COMMON" | "UNCOMMON" | "RARE" | "SUPER_RARE" | "ULTRA_RARE" | "SECRET_RARE" | "SPECIAL";
type GameType = "POKEMON" | "YUGIOH" | "MTG" | "ONEPIECE";

const delay = (ms: number) => new Promise(r => setTimeout(r, ms));

// Batched upsert — groups N upserts into a single $transaction call
const BATCH_SIZE = 50;

interface CardData {
  id: string;
  externalId: string;
  name: string;
  gameType: GameType;
  setName: string | null;
  setCode: string | null;
  rarity: PrismaRarity;
  imageUrl: string | null;
  marketPrice: number | null;
  pokemon?: {
    hp: number | null; types: string[]; evolvesFrom: string | null;
    stage: string | null; weakness: string | null; resistance: string | null; retreatCost: number | null;
  };
  yugioh?: {
    cardType: string | null; attribute: string | null; level: number | null;
    attack: number | null; defense: number | null; race: string | null; archetype: string | null;
  };
  mtg?: {
    manaCost: string | null; cmc: number | null; colors: string[]; typeLine: string | null;
    oracleText: string | null; power: string | null; toughness: string | null; loyalty: string | null;
  };
  onepiece?: {
    color: string | null; cost: number | null; power: number | null;
    counter: number | null; attribute: string | null; cardType: string | null;
  };
}

async function batchUpsert(cards: CardData[]): Promise<number> {
  let total = 0;
  for (let i = 0; i < cards.length; i += BATCH_SIZE) {
    const batch = cards.slice(i, i + BATCH_SIZE);
    try {
      await prisma.$transaction(
        batch.map(card => prisma.card.upsert({
          where: { id: card.id },
          create: {
            id: card.id,
            externalId: card.externalId,
            name: card.name,
            gameType: card.gameType,
            setName: card.setName,
            setCode: card.setCode,
            rarity: card.rarity,
            imageUrl: card.imageUrl,
            marketPrice: card.marketPrice,
            ...(card.pokemon ? { pokemonDetails: { create: card.pokemon } } : {}),
            ...(card.yugioh ? { yugiohDetails: { create: card.yugioh } } : {}),
            ...(card.mtg ? { mtgDetails: { create: card.mtg } } : {}),
            ...(card.onepiece ? { onepieceDetails: { create: card.onepiece } } : {}),
          },
          update: {
            name: card.name,
            imageUrl: card.imageUrl,
            marketPrice: card.marketPrice,
            rarity: card.rarity,
          },
        })),
      );
      total += batch.length;
    } catch {
      // Fallback: try one by one if batch fails
      for (const card of batch) {
        try {
          await prisma.card.upsert({
            where: { id: card.id },
            create: {
              id: card.id, externalId: card.externalId, name: card.name,
              gameType: card.gameType, setName: card.setName, setCode: card.setCode,
              rarity: card.rarity, imageUrl: card.imageUrl, marketPrice: card.marketPrice,
              ...(card.pokemon ? { pokemonDetails: { create: card.pokemon } } : {}),
              ...(card.yugioh ? { yugiohDetails: { create: card.yugioh } } : {}),
              ...(card.mtg ? { mtgDetails: { create: card.mtg } } : {}),
              ...(card.onepiece ? { onepieceDetails: { create: card.onepiece } } : {}),
            },
            update: { name: card.name, imageUrl: card.imageUrl, marketPrice: card.marketPrice, rarity: card.rarity },
          });
          total++;
        } catch { /* skip */ }
      }
    }
  }
  return total;
}

// ═══════════════════════════════════════════════════
// POKEMON
// ═══════════════════════════════════════════════════

const PKM_RARITY: Record<string, PrismaRarity> = {
  Common: "COMMON", Uncommon: "UNCOMMON", Rare: "RARE", "Rare Holo": "RARE",
  "Rare Holo EX": "SUPER_RARE", "Rare Holo GX": "SUPER_RARE", "Rare Holo V": "SUPER_RARE",
  "Rare VMAX": "ULTRA_RARE", "Rare Ultra": "ULTRA_RARE", "Ultra Rare": "ULTRA_RARE",
  "Rare Secret": "SECRET_RARE", "Rare Rainbow": "SECRET_RARE", "Hyper Rare": "SECRET_RARE",
  "Rare Shiny": "SPECIAL", "Amazing Rare": "SPECIAL", "Illustration Rare": "SPECIAL",
  "Special Art Rare": "SPECIAL", "Double Rare": "RARE", LEGEND: "SPECIAL", Promo: "SPECIAL",
};

const GITHUB = "https://raw.githubusercontent.com/PokemonTCG/pokemon-tcg-data/master";

async function importAllPokemon(): Promise<number> {
  console.log("\n══ POKEMON TCG ══");
  const setsRes = await fetch(`${GITHUB}/sets/en.json`);
  if (!setsRes.ok) { console.error(`  Sets fetch failed: ${setsRes.status}`); return 0; }
  const sets = (await setsRes.json()) as { id: string; name: string }[];
  console.log(`  ${sets.length} sets`);
  let total = 0;

  for (let i = 0; i < sets.length; i++) {
    const set = sets[i];
    process.stdout.write(`  [${i + 1}/${sets.length}] ${set.name} (${set.id})...`);
    try {
      const res = await fetch(`${GITHUB}/cards/en/${set.id}.json`);
      if (!res.ok) { console.log(` SKIP`); continue; }
      const raw = (await res.json()) as Record<string, unknown>[];
      const cards: CardData[] = raw.map(c => {
        const subtypes = c.subtypes as string[] | undefined;
        const weaknesses = c.weaknesses as { type: string; value: string }[] | undefined;
        const resistances = c.resistances as { type: string; value: string }[] | undefined;
        const cm = c.cardmarket as { prices?: { averageSellPrice?: number } } | undefined;
        const images = c.images as { small: string } | undefined;
        return {
          id: `pokemon-${c.id as string}`, externalId: c.id as string, name: c.name as string,
          gameType: "POKEMON" as const, setName: set.name, setCode: set.id,
          rarity: PKM_RARITY[(c.rarity as string) ?? ""] ?? "RARE",
          imageUrl: images?.small ?? null, marketPrice: cm?.prices?.averageSellPrice ?? null,
          pokemon: {
            hp: (c.hp as string) ? parseInt(c.hp as string, 10) || null : null,
            types: (c.types as string[]) ?? [], evolvesFrom: (c.evolvesFrom as string) ?? null,
            stage: subtypes?.includes("Basic") ? "Basic" : subtypes?.includes("Stage 1") ? "Stage 1" : subtypes?.includes("Stage 2") ? "Stage 2" : subtypes?.[0] ?? null,
            weakness: weaknesses?.[0] ? `${weaknesses[0].type} ${weaknesses[0].value}` : null,
            resistance: resistances?.[0] ? `${resistances[0].type} ${resistances[0].value}` : null,
            retreatCost: (c.retreatCost as string[])?.length ?? null,
          },
        };
      });
      const count = await batchUpsert(cards);
      console.log(` ${count} cards`);
      total += count;
    } catch (e) { console.log(` ERR: ${e instanceof Error ? e.message : e}`); }
    await delay(50);
  }
  console.log(`  POKEMON TOTAL: ${total}`);
  return total;
}

// ═══════════════════════════════════════════════════
// YU-GI-OH!
// ═══════════════════════════════════════════════════

const YGO_RARITY: Record<string, PrismaRarity> = {
  Common: "COMMON", Rare: "RARE", "Super Rare": "SUPER_RARE", "Ultra Rare": "ULTRA_RARE",
  "Secret Rare": "SECRET_RARE", "Ultimate Rare": "SECRET_RARE",
  "Ghost Rare": "SPECIAL", "Starlight Rare": "SPECIAL", "Short Print": "UNCOMMON",
};

async function importAllYugioh(): Promise<number> {
  console.log("\n══ YU-GI-OH! ══");
  let total = 0;
  let offset = 0;
  const batchSize = 100;
  let hasMore = true;

  while (hasMore) {
    process.stdout.write(`  Batch offset=${offset}...`);
    try {
      const res = await fetch(`https://db.ygoprodeck.com/api/v7/cardinfo.php?num=${batchSize}&offset=${offset}`);
      if (!res.ok) { console.log(` SKIP (${res.status})`); break; }
      const json = (await res.json()) as { data: Record<string, unknown>[]; meta?: { rows_remaining: number } };
      const cards: CardData[] = json.data.map(c => {
        const cs = (c.card_sets as { set_name: string; set_code: string; set_rarity: string }[] | undefined)?.[0];
        const img = (c.card_images as { image_url_small: string }[] | undefined)?.[0];
        const pr = (c.card_prices as { tcgplayer_price: string }[] | undefined)?.[0]?.tcgplayer_price;
        return {
          id: `yugioh-${c.id as number}`, externalId: String(c.id), name: c.name as string,
          gameType: "YUGIOH" as const, setName: cs?.set_name ?? null, setCode: cs?.set_code ?? null,
          rarity: YGO_RARITY[cs?.set_rarity ?? ""] ?? "RARE",
          imageUrl: img?.image_url_small ?? null, marketPrice: pr ? parseFloat(pr) || null : null,
          yugioh: {
            cardType: (c.type as string) ?? null, attribute: (c.attribute as string) ?? null,
            level: (c.level as number) ?? null, attack: (c.atk as number) ?? null,
            defense: (c.def as number) ?? null, race: (c.race as string) ?? null,
            archetype: (c.archetype as string) ?? null,
          },
        };
      });
      const count = await batchUpsert(cards);
      console.log(` ${count} cards`);
      total += count;
      hasMore = (json.meta?.rows_remaining ?? 0) > 0;
      offset += batchSize;
    } catch (e) { console.log(` ERR: ${e instanceof Error ? e.message : e}`); break; }
    await delay(200);
  }
  console.log(`  YUGIOH TOTAL: ${total}`);
  return total;
}

// ═══════════════════════════════════════════════════
// MTG
// ═══════════════════════════════════════════════════

const MTG_RARITY: Record<string, PrismaRarity> = {
  common: "COMMON", uncommon: "UNCOMMON", rare: "RARE", mythic: "ULTRA_RARE", special: "SPECIAL", bonus: "SPECIAL",
};
const MTG_TYPES = new Set(["expansion", "core", "masters", "draft_innovation"]);

async function importAllMtg(): Promise<number> {
  console.log("\n══ MAGIC: THE GATHERING ══");
  const setsRes = await fetch("https://api.scryfall.com/sets");
  if (!setsRes.ok) { console.error(`  Sets fetch failed: ${setsRes.status}`); return 0; }
  const setsJson = (await setsRes.json()) as { data: { code: string; name: string; set_type: string; released_at: string }[] };
  const sets = setsJson.data.filter(s => MTG_TYPES.has(s.set_type)).sort((a, b) => b.released_at.localeCompare(a.released_at));
  console.log(`  ${sets.length} sets`);
  let total = 0;

  for (let i = 0; i < sets.length; i++) {
    const set = sets[i];
    process.stdout.write(`  [${i + 1}/${sets.length}] ${set.name} (${set.code})...`);
    try {
      let setCount = 0;
      let url: string | null = `https://api.scryfall.com/cards/search?q=set:${set.code}&order=set`;
      while (url) {
        await delay(120);
        const res = await fetch(url);
        if (!res.ok) { if (res.status === 404) break; console.log(` SKIP (${res.status})`); break; }
        const json = (await res.json()) as { data: Record<string, unknown>[]; has_more: boolean; next_page?: string };
        const cards: CardData[] = json.data.map(c => {
          const iu = c.image_uris as { small: string } | undefined;
          const cf = c.card_faces as { image_uris?: { small: string } }[] | undefined;
          const pr = (c.prices as { usd: string | null })?.usd;
          return {
            id: `mtg-${c.id as string}`, externalId: c.id as string, name: c.name as string,
            gameType: "MTG" as const, setName: c.set_name as string, setCode: c.set as string,
            rarity: MTG_RARITY[(c.rarity as string)] ?? "RARE",
            imageUrl: iu?.small ?? cf?.[0]?.image_uris?.small ?? null,
            marketPrice: pr ? parseFloat(pr) || null : null,
            mtg: {
              manaCost: (c.mana_cost as string) ?? null, cmc: (c.cmc as number) ?? null,
              colors: (c.colors as string[]) ?? [], typeLine: (c.type_line as string) ?? null,
              oracleText: (c.oracle_text as string) ?? null, power: (c.power as string) ?? null,
              toughness: (c.toughness as string) ?? null, loyalty: (c.loyalty as string) ?? null,
            },
          };
        });
        const count = await batchUpsert(cards);
        setCount += count;
        url = json.has_more && json.next_page ? json.next_page : null;
      }
      console.log(` ${setCount} cards`);
      total += setCount;
    } catch (e) { console.log(` ERR: ${e instanceof Error ? e.message : e}`); }
    await delay(300);
  }
  console.log(`  MTG TOTAL: ${total}`);
  return total;
}

// ═══════════════════════════════════════════════════
// ONE PIECE
// ═══════════════════════════════════════════════════

const OP_RARITY: Record<string, PrismaRarity> = {
  C: "COMMON", UC: "UNCOMMON", R: "RARE", SR: "SUPER_RARE", SEC: "SECRET_RARE",
  L: "SPECIAL", SP: "SPECIAL", P: "SPECIAL", TR: "SPECIAL",
};

interface OPCard {
  card_name: string; card_set_id: string; set_id: string; set_name: string;
  rarity: string; card_color: string; card_type: string;
  card_cost: string | null; card_power: string | null;
  counter_amount: number | null; attribute: string | null;
  card_image: string; market_price: number | null;
}

function mapOPCards(raw: OPCard[]): CardData[] {
  return raw.map(c => ({
    id: `onepiece-${c.card_set_id}`, externalId: c.card_set_id, name: c.card_name,
    gameType: "ONEPIECE" as const, setName: c.set_name, setCode: c.set_id,
    rarity: OP_RARITY[c.rarity] ?? "RARE", imageUrl: c.card_image, marketPrice: c.market_price,
    onepiece: {
      color: c.card_color ?? null, cost: c.card_cost ? parseInt(c.card_cost, 10) || null : null,
      power: c.card_power ? parseInt(c.card_power, 10) || null : null,
      counter: c.counter_amount ?? null, attribute: c.attribute ?? null, cardType: c.card_type ?? null,
    },
  }));
}

async function importAllOnePiece(): Promise<number> {
  console.log("\n══ ONE PIECE ══");
  const setsRes = await fetch("https://optcgapi.com/api/allSets/");
  if (!setsRes.ok) { console.error(`  Sets fetch failed: ${setsRes.status}`); return 0; }
  const sets = (await setsRes.json()) as { set_id: string; set_name: string }[];
  console.log(`  ${sets.length} sets`);
  let total = 0;

  for (let i = 0; i < sets.length; i++) {
    const set = sets[i];
    process.stdout.write(`  [${i + 1}/${sets.length}] ${set.set_name} (${set.set_id})...`);
    try {
      const res = await fetch(`https://optcgapi.com/api/sets/${encodeURIComponent(set.set_id)}/`);
      if (!res.ok) { console.log(` SKIP`); continue; }
      const raw = (await res.json()) as OPCard[];
      const count = await batchUpsert(mapOPCards(raw));
      console.log(` ${count} cards`);
      total += count;
    } catch (e) { console.log(` ERR: ${e instanceof Error ? e.message : e}`); }
    await delay(150);
  }

  process.stdout.write("  Starter decks...");
  try {
    const res = await fetch("https://optcgapi.com/api/allSTCards/");
    if (res.ok) {
      const raw = (await res.json()) as OPCard[];
      const count = await batchUpsert(mapOPCards(raw));
      console.log(` ${count} cards`);
      total += count;
    }
  } catch (e) { console.log(` ERR: ${e instanceof Error ? e.message : e}`); }

  console.log(`  ONEPIECE TOTAL: ${total}`);
  return total;
}

// ═══════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════

async function main() {
  console.log("╔══════════════════════════════════════════════╗");
  console.log("║  TCG All-in-One — Fast Production Seed      ║");
  console.log("╚══════════════════════════════════════════════╝");
  const start = Date.now();

  let p = 0, y = 0, m = 0, o = 0;
  try { p = await importAllPokemon(); } catch (e) { console.error(`\n  POKEMON FAILED: ${e}`); }
  try { y = await importAllYugioh(); } catch (e) { console.error(`\n  YUGIOH FAILED: ${e}`); }
  try { m = await importAllMtg(); } catch (e) { console.error(`\n  MTG FAILED: ${e}`); }
  try { o = await importAllOnePiece(); } catch (e) { console.error(`\n  ONEPIECE FAILED: ${e}`); }

  const t = p + y + m + o;
  const s = Math.round((Date.now() - start) / 1000);
  console.log(`\n══ SUMMARY ══`);
  console.log(`  Pokemon:   ${p}`);
  console.log(`  Yu-Gi-Oh!: ${y}`);
  console.log(`  MTG:       ${m}`);
  console.log(`  One Piece: ${o}`);
  console.log(`  TOTAL:     ${t} cards in ${s}s`);

  await prisma.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
