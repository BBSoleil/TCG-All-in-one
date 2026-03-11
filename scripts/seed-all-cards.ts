/**
 * Comprehensive seed script — imports ALL cards from all 4 TCG APIs.
 * Run with: npx tsx scripts/seed-all-cards.ts
 *
 * Estimated totals:
 *   Pokemon:   ~17,000+ cards (all sets)
 *   Yu-Gi-Oh!: ~13,000+ cards (full database)
 *   MTG:       ~80,000+ cards (all expansion/core/masters/draft sets)
 *   One Piece: ~3,000+ cards (all booster sets + starter decks)
 */

import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

function resolveConnectionString(): string {
  const raw = process.env["DATABASE_URL"];
  if (!raw) {
    console.error("DATABASE_URL is required. Set it in .env or pass it inline.");
    process.exit(1);
  }
  // Handle prisma+postgres:// proxy URLs by extracting the embedded database URL
  if (raw.startsWith("prisma+postgres://")) {
    const url = new URL(raw);
    const apiKey = url.searchParams.get("api_key");
    if (apiKey) {
      const decoded = JSON.parse(Buffer.from(apiKey, "base64").toString()) as {
        databaseUrl: string;
      };
      console.log("  Resolved prisma+postgres:// to direct database URL");
      return decoded.databaseUrl;
    }
  }
  return raw;
}

const connectionString = resolveConnectionString();
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

type PrismaRarity =
  | "COMMON"
  | "UNCOMMON"
  | "RARE"
  | "SUPER_RARE"
  | "ULTRA_RARE"
  | "SECRET_RARE"
  | "SPECIAL";

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

const pokemonApiKey = process.env["POKEMON_TCG_API_KEY"];
const pokemonHeaders: Record<string, string> = pokemonApiKey
  ? { "X-Api-Key": pokemonApiKey }
  : {};

// ═══════════════════════════════════════════════════════════════
// POKEMON — pokemontcg.io
// ═══════════════════════════════════════════════════════════════

const POKEMON_RARITY: Record<string, PrismaRarity> = {
  Common: "COMMON",
  Uncommon: "UNCOMMON",
  Rare: "RARE",
  "Rare Holo": "RARE",
  "Rare Holo EX": "SUPER_RARE",
  "Rare Holo GX": "SUPER_RARE",
  "Rare Holo V": "SUPER_RARE",
  "Rare VMAX": "ULTRA_RARE",
  "Rare Ultra": "ULTRA_RARE",
  "Ultra Rare": "ULTRA_RARE",
  "Rare Secret": "SECRET_RARE",
  "Rare Rainbow": "SECRET_RARE",
  "Hyper Rare": "SECRET_RARE",
  "Rare Shiny": "SPECIAL",
  "Amazing Rare": "SPECIAL",
  "Illustration Rare": "SPECIAL",
  "Special Art Rare": "SPECIAL",
  "Double Rare": "RARE",
  LEGEND: "SPECIAL",
  Promo: "SPECIAL",
};

// GitHub raw data — same structure as the API, always accessible
const POKEMON_GITHUB_BASE =
  "https://raw.githubusercontent.com/PokemonTCG/pokemon-tcg-data/master";

async function importAllPokemon(): Promise<number> {
  console.log("\n══ POKEMON TCG ══");
  console.log("  Using GitHub data (pokemontcg.io API unreliable)");

  // Fetch all sets from GitHub
  const setsRes = await fetch(`${POKEMON_GITHUB_BASE}/sets/en.json`);
  if (!setsRes.ok) {
    console.error(`  Failed to fetch sets: ${setsRes.status}`);
    return 0;
  }
  const sets = (await setsRes.json()) as {
    id: string;
    name: string;
    total: number;
  }[];
  // Sort by release date isn't available in the JSON, but order doesn't matter for full import
  console.log(`  Found ${sets.length} sets`);

  let total = 0;

  for (let i = 0; i < sets.length; i++) {
    const set = sets[i];
    process.stdout.write(
      `  [${i + 1}/${sets.length}] ${set.name} (${set.id})...`,
    );

    try {
      const res = await fetch(
        `${POKEMON_GITHUB_BASE}/cards/en/${set.id}.json`,
      );
      if (!res.ok) {
        console.log(` SKIP (${res.status})`);
        continue;
      }
      const cards = (await res.json()) as Record<string, unknown>[];
      let count = 0;

      for (const card of cards) {
        const id = card.id as string;
        const name = card.name as string;
        const rarity = card.rarity as string | undefined;
        const images = card.images as { small: string; large: string } | undefined;
        const hp = card.hp as string | undefined;
        const types = card.types as string[] | undefined;
        const evolvesFrom = card.evolvesFrom as string | undefined;
        const subtypes = card.subtypes as string[] | undefined;
        const weaknesses = card.weaknesses as
          | { type: string; value: string }[]
          | undefined;
        const resistances = card.resistances as
          | { type: string; value: string }[]
          | undefined;
        const retreatCost = card.retreatCost as string[] | undefined;
        const cardmarket = card.cardmarket as
          | { prices?: { averageSellPrice?: number } }
          | undefined;

        const price = cardmarket?.prices?.averageSellPrice ?? null;
        const mappedRarity = POKEMON_RARITY[rarity ?? ""] ?? "RARE";
        const imageUrl = images?.large ?? images?.small ??
          `https://images.pokemontcg.io/${set.id}/${id.split("-").pop()}.png`;
        const stage = subtypes?.includes("Basic")
          ? "Basic"
          : subtypes?.includes("Stage 1")
            ? "Stage 1"
            : subtypes?.includes("Stage 2")
              ? "Stage 2"
              : (subtypes?.[0] ?? null);

        try {
          await prisma.card.upsert({
            where: { id: `pokemon-${id}` },
            create: {
              id: `pokemon-${id}`,
              externalId: id,
              name,
              gameType: "POKEMON",
              setName: set.name,
              setCode: set.id,
              rarity: mappedRarity,
              imageUrl,
              marketPrice: price,
              pokemonDetails: {
                create: {
                  hp: hp ? parseInt(hp, 10) || null : null,
                  types: types ?? [],
                  evolvesFrom: evolvesFrom ?? null,
                  stage,
                  weakness: weaknesses?.[0]
                    ? `${weaknesses[0].type} ${weaknesses[0].value}`
                    : null,
                  resistance: resistances?.[0]
                    ? `${resistances[0].type} ${resistances[0].value}`
                    : null,
                  retreatCost: retreatCost?.length ?? null,
                },
              },
            },
            update: {
              name,
              imageUrl,
              marketPrice: price,
              rarity: mappedRarity,
            },
          });
          count++;
        } catch {
          // skip card-level errors
        }
      }

      console.log(` ${count} cards`);
      total += count;
    } catch (err) {
      console.log(` ERROR: ${err instanceof Error ? err.message : err}`);
    }

    await delay(100); // small delay for GitHub rate limits
  }

  console.log(`  POKEMON TOTAL: ${total} cards`);
  return total;
}

// ═══════════════════════════════════════════════════════════════
// YU-GI-OH! — ygoprodeck.com
// ═══════════════════════════════════════════════════════════════

const YGO_RARITY: Record<string, PrismaRarity> = {
  Common: "COMMON",
  Rare: "RARE",
  "Super Rare": "SUPER_RARE",
  "Ultra Rare": "ULTRA_RARE",
  "Secret Rare": "SECRET_RARE",
  "Ultimate Rare": "SECRET_RARE",
  "Ghost Rare": "SPECIAL",
  "Starlight Rare": "SPECIAL",
  "Short Print": "UNCOMMON",
};

async function importAllYugioh(): Promise<number> {
  console.log("\n══ YU-GI-OH! ══");

  let total = 0;
  let offset = 0;
  const batchSize = 100;
  let hasMore = true;

  while (hasMore) {
    process.stdout.write(
      `  Batch offset=${offset}, size=${batchSize}...`,
    );

    try {
      const res = await fetch(
        `https://db.ygoprodeck.com/api/v7/cardinfo.php?num=${batchSize}&offset=${offset}`,
      );
      if (!res.ok) {
        console.log(` SKIP (${res.status})`);
        break;
      }
      const json = (await res.json()) as {
        data: Record<string, unknown>[];
        meta?: { total_rows: number; rows_remaining: number };
      };
      let count = 0;

      for (const card of json.data) {
        const id = card.id as number;
        const name = card.name as string;
        const type = card.type as string;
        const attribute = card.attribute as string | undefined;
        const level = card.level as number | undefined;
        const atk = card.atk as number | undefined;
        const def = card.def as number | undefined;
        const race = card.race as string | undefined;
        const archetype = card.archetype as string | undefined;
        const cardSets = card.card_sets as
          | { set_name: string; set_code: string; set_rarity: string }[]
          | undefined;
        const cardImages = card.card_images as
          | { image_url: string; image_url_small: string }[]
          | undefined;
        const cardPrices = card.card_prices as
          | { tcgplayer_price: string }[]
          | undefined;

        const setInfo = cardSets?.[0];
        const priceStr = cardPrices?.[0]?.tcgplayer_price;
        const price = priceStr ? parseFloat(priceStr) || null : null;

        try {
          await prisma.card.upsert({
            where: { id: `yugioh-${id}` },
            create: {
              id: `yugioh-${id}`,
              externalId: String(id),
              name,
              gameType: "YUGIOH",
              setName: setInfo?.set_name ?? null,
              setCode: setInfo?.set_code ?? null,
              rarity: YGO_RARITY[setInfo?.set_rarity ?? ""] ?? "RARE",
              imageUrl: cardImages?.[0]?.image_url ?? null,
              marketPrice: price,
              yugiohDetails: {
                create: {
                  cardType: type ?? null,
                  attribute: attribute ?? null,
                  level: level ?? null,
                  attack: atk ?? null,
                  defense: def ?? null,
                  race: race ?? null,
                  archetype: archetype ?? null,
                },
              },
            },
            update: {
              name,
              imageUrl: cardImages?.[0]?.image_url ?? null,
              marketPrice: price,
            },
          });
          count++;
        } catch {
          // skip card-level errors
        }
      }

      console.log(` ${count} cards`);
      total += count;
      hasMore = (json.meta?.rows_remaining ?? 0) > 0;
      offset += batchSize;
    } catch (err) {
      console.log(` ERROR: ${err instanceof Error ? err.message : err}`);
      break;
    }

    await delay(200);
  }

  console.log(`  YUGIOH TOTAL: ${total} cards`);
  return total;
}

// ═══════════════════════════════════════════════════════════════
// MAGIC: THE GATHERING — Scryfall
// ═══════════════════════════════════════════════════════════════

const MTG_RARITY: Record<string, PrismaRarity> = {
  common: "COMMON",
  uncommon: "UNCOMMON",
  rare: "RARE",
  mythic: "ULTRA_RARE",
  special: "SPECIAL",
  bonus: "SPECIAL",
};

const MTG_SET_TYPES = new Set([
  "expansion",
  "core",
  "masters",
  "draft_innovation",
]);

async function importAllMtg(): Promise<number> {
  console.log("\n══ MAGIC: THE GATHERING ══");

  // Fetch all sets
  const setsRes = await fetch("https://api.scryfall.com/sets");
  if (!setsRes.ok) {
    console.error(`  Failed to fetch sets: ${setsRes.status}`);
    return 0;
  }
  const setsJson = (await setsRes.json()) as {
    data: {
      code: string;
      name: string;
      card_count: number;
      set_type: string;
      released_at: string;
    }[];
  };
  const sets = setsJson.data
    .filter((s) => MTG_SET_TYPES.has(s.set_type))
    .sort((a, b) => b.released_at.localeCompare(a.released_at));
  console.log(`  Found ${sets.length} sets (expansion/core/masters/draft)`);

  let total = 0;

  for (let i = 0; i < sets.length; i++) {
    const set = sets[i];
    process.stdout.write(
      `  [${i + 1}/${sets.length}] ${set.name} (${set.code})...`,
    );

    try {
      let count = 0;
      let url: string | null =
        `https://api.scryfall.com/cards/search?q=set:${set.code}&order=set`;

      while (url) {
        await delay(120); // Scryfall rate limit: 10 req/s
        const res = await fetch(url);
        if (!res.ok) {
          if (res.status === 404) break; // empty set
          console.log(` SKIP page (${res.status})`);
          break;
        }

        const json = (await res.json()) as {
          data: Record<string, unknown>[];
          has_more: boolean;
          next_page?: string;
        };

        for (const card of json.data) {
          const id = card.id as string;
          const name = card.name as string;
          const rarity = card.rarity as string;
          const setCode = card.set as string;
          const setName = card.set_name as string;
          const manaCost = card.mana_cost as string | undefined;
          const cmc = card.cmc as number | undefined;
          const colors = card.colors as string[] | undefined;
          const typeLine = card.type_line as string | undefined;
          const oracleText = card.oracle_text as string | undefined;
          const power = card.power as string | undefined;
          const toughness = card.toughness as string | undefined;
          const loyalty = card.loyalty as string | undefined;
          const imageUris = card.image_uris as
            | { normal: string; small: string }
            | undefined;
          const cardFaces = card.card_faces as
            | { image_uris?: { normal: string; small: string } }[]
            | undefined;
          const prices = card.prices as {
            usd: string | null;
          };

          const imageUrl =
            imageUris?.normal ??
            cardFaces?.[0]?.image_uris?.normal ??
            null;
          const priceStr = prices?.usd;
          const price = priceStr ? parseFloat(priceStr) || null : null;

          try {
            await prisma.card.upsert({
              where: { id: `mtg-${id}` },
              create: {
                id: `mtg-${id}`,
                externalId: id,
                name,
                gameType: "MTG",
                setName,
                setCode,
                rarity: MTG_RARITY[rarity] ?? "RARE",
                imageUrl,
                marketPrice: price,
                mtgDetails: {
                  create: {
                    manaCost: manaCost ?? null,
                    cmc: cmc ?? null,
                    colors: colors ?? [],
                    typeLine: typeLine ?? null,
                    oracleText: oracleText ?? null,
                    power: power ?? null,
                    toughness: toughness ?? null,
                    loyalty: loyalty ?? null,
                  },
                },
              },
              update: {
                name,
                imageUrl,
                marketPrice: price,
                rarity: MTG_RARITY[rarity] ?? "RARE",
              },
            });
            count++;
          } catch {
            // skip card-level errors
          }
        }

        url = json.has_more && json.next_page ? json.next_page : null;
      }

      console.log(` ${count} cards`);
      total += count;
    } catch (err) {
      console.log(` ERROR: ${err instanceof Error ? err.message : err}`);
    }

    await delay(300); // gap between sets
  }

  console.log(`  MTG TOTAL: ${total} cards`);
  return total;
}

// ═══════════════════════════════════════════════════════════════
// ONE PIECE — optcgapi.com
// ═══════════════════════════════════════════════════════════════

const OP_RARITY: Record<string, PrismaRarity> = {
  C: "COMMON",
  UC: "UNCOMMON",
  R: "RARE",
  SR: "SUPER_RARE",
  SEC: "SECRET_RARE",
  L: "SPECIAL",
  SP: "SPECIAL",
  P: "SPECIAL",
  TR: "SPECIAL",
};

interface OnePieceCard {
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

async function upsertOnePieceCards(cards: OnePieceCard[]): Promise<number> {
  let count = 0;
  for (const card of cards) {
    const cost = card.card_cost
      ? parseInt(card.card_cost, 10) || null
      : null;
    const power = card.card_power
      ? parseInt(card.card_power, 10) || null
      : null;

    try {
      await prisma.card.upsert({
        where: { id: `onepiece-${card.card_set_id}` },
        create: {
          id: `onepiece-${card.card_set_id}`,
          externalId: card.card_set_id,
          name: card.card_name,
          gameType: "ONEPIECE",
          setName: card.set_name,
          setCode: card.set_id,
          rarity: OP_RARITY[card.rarity] ?? "RARE",
          imageUrl: card.card_image,
          marketPrice: card.market_price,
          onepieceDetails: {
            create: {
              color: card.card_color ?? null,
              cost,
              power,
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
          rarity: OP_RARITY[card.rarity] ?? "RARE",
        },
      });
      count++;
    } catch {
      // skip card-level errors
    }
  }
  return count;
}

async function importAllOnePiece(): Promise<number> {
  console.log("\n══ ONE PIECE CARD GAME ══");

  let total = 0;

  // Fetch all booster sets
  const setsRes = await fetch("https://optcgapi.com/api/allSets/");
  if (!setsRes.ok) {
    console.error(`  Failed to fetch sets: ${setsRes.status}`);
    return 0;
  }
  const sets = (await setsRes.json()) as {
    set_id: string;
    set_name: string;
  }[];
  console.log(`  Found ${sets.length} booster sets`);

  for (let i = 0; i < sets.length; i++) {
    const set = sets[i];
    process.stdout.write(
      `  [${i + 1}/${sets.length}] ${set.set_name} (${set.set_id})...`,
    );

    try {
      const res = await fetch(
        `https://optcgapi.com/api/sets/${encodeURIComponent(set.set_id)}/`,
      );
      if (!res.ok) {
        console.log(` SKIP (${res.status})`);
        await delay(150);
        continue;
      }
      const cards = (await res.json()) as OnePieceCard[];
      const count = await upsertOnePieceCards(cards);
      console.log(` ${count} cards`);
      total += count;
    } catch (err) {
      console.log(` ERROR: ${err instanceof Error ? err.message : err}`);
    }

    await delay(150);
  }

  // Starter decks
  process.stdout.write("  Starter decks...");
  try {
    const res = await fetch("https://optcgapi.com/api/allSTCards/");
    if (res.ok) {
      const cards = (await res.json()) as OnePieceCard[];
      const count = await upsertOnePieceCards(cards);
      console.log(` ${count} cards`);
      total += count;
    } else {
      console.log(` SKIP (${res.status})`);
    }
  } catch (err) {
    console.log(` ERROR: ${err instanceof Error ? err.message : err}`);
  }

  console.log(`  ONEPIECE TOTAL: ${total} cards`);
  return total;
}

// ═══════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════

async function main() {
  console.log("╔══════════════════════════════════════════════╗");
  console.log("║   TCG All-in-One — Full Card Database Seed  ║");
  console.log("╚══════════════════════════════════════════════╝");

  const startTime = Date.now();

  let pokemonTotal = 0;
  let yugiohTotal = 0;
  let mtgTotal = 0;
  let onepieceTotal = 0;

  try { pokemonTotal = await importAllPokemon(); }
  catch (e) { console.error(`\n  POKEMON FAILED: ${e instanceof Error ? e.message : e}`); }

  try { yugiohTotal = await importAllYugioh(); }
  catch (e) { console.error(`\n  YUGIOH FAILED: ${e instanceof Error ? e.message : e}`); }

  try { mtgTotal = await importAllMtg(); }
  catch (e) { console.error(`\n  MTG FAILED: ${e instanceof Error ? e.message : e}`); }

  try { onepieceTotal = await importAllOnePiece(); }
  catch (e) { console.error(`\n  ONEPIECE FAILED: ${e instanceof Error ? e.message : e}`); }

  const elapsed = Math.round((Date.now() - startTime) / 1000);
  const grandTotal = pokemonTotal + yugiohTotal + mtgTotal + onepieceTotal;

  console.log("\n╔══════════════════════════════════════════════╗");
  console.log("║               IMPORT SUMMARY                ║");
  console.log("╠══════════════════════════════════════════════╣");
  console.log(`║  Pokemon:     ${String(pokemonTotal).padStart(7)} cards              ║`);
  console.log(`║  Yu-Gi-Oh!:   ${String(yugiohTotal).padStart(7)} cards              ║`);
  console.log(`║  MTG:         ${String(mtgTotal).padStart(7)} cards              ║`);
  console.log(`║  One Piece:   ${String(onepieceTotal).padStart(7)} cards              ║`);
  console.log("╠══════════════════════════════════════════════╣");
  console.log(`║  TOTAL:       ${String(grandTotal).padStart(7)} cards              ║`);
  console.log(`║  Time:        ${String(elapsed).padStart(5)}s                    ║`);
  console.log("╚══════════════════════════════════════════════╝");

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
