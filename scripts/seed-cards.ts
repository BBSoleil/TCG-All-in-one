/**
 * Seed script — imports real cards from public APIs into the database.
 * Run with: DATABASE_URL="..." npx tsx scripts/seed-cards.ts
 */

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const connectionString = process.env["DATABASE_URL"]!;
if (!connectionString) {
  console.error("DATABASE_URL is required");
  process.exit(1);
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

type PrismaRarity = "COMMON" | "UNCOMMON" | "RARE" | "SUPER_RARE" | "ULTRA_RARE" | "SECRET_RARE" | "SPECIAL";

// ─── Pokemon ───────────────────────────────────────────────

const POKEMON_RARITY_MAP: Record<string, PrismaRarity> = {
  Common: "COMMON", Uncommon: "UNCOMMON", Rare: "RARE",
  "Rare Holo": "RARE", "Rare Holo EX": "SUPER_RARE", "Rare Holo GX": "SUPER_RARE",
  "Rare Holo V": "SUPER_RARE", "Rare Ultra": "ULTRA_RARE", "Rare VMAX": "ULTRA_RARE",
  "Rare Secret": "SECRET_RARE", "Rare Rainbow": "SECRET_RARE",
  "Rare Shiny": "SPECIAL", "Amazing Rare": "SPECIAL", "Illustration Rare": "SPECIAL",
  "Special Art Rare": "SPECIAL", "Hyper Rare": "SECRET_RARE",
  "Double Rare": "RARE", "Ultra Rare": "ULTRA_RARE",
};

async function importPokemonSet(setId: string) {
  console.log(`  Importing Pokemon set: ${setId}...`);
  const res = await fetch(`https://api.pokemontcg.io/v2/cards?q=set.id:${setId}&pageSize=250`);
  if (!res.ok) { console.error(`    Failed: ${res.status} ${res.statusText}`); return 0; }
  const json = await res.json();
  let count = 0;
  for (const card of json.data) {
    const price = card.cardmarket?.prices?.averageSellPrice ?? null;
    try {
      await prisma.card.upsert({
        where: { id: `pokemon-${card.id}` },
        create: {
          id: `pokemon-${card.id}`, externalId: card.id, name: card.name,
          gameType: "POKEMON", setName: card.set.name, setCode: card.set.id,
          rarity: POKEMON_RARITY_MAP[card.rarity ?? ""] ?? "RARE",
          imageUrl: card.images.small, marketPrice: price,
          pokemonDetails: {
            create: {
              hp: card.hp ? parseInt(card.hp, 10) || null : null,
              types: card.types ?? [], evolvesFrom: card.evolvesFrom ?? null,
              stage: card.subtypes?.includes("Basic") ? "Basic" : card.subtypes?.includes("Stage 1") ? "Stage 1" : card.subtypes?.includes("Stage 2") ? "Stage 2" : card.subtypes?.[0] ?? null,
              weakness: card.weaknesses?.[0] ? `${card.weaknesses[0].type} ${card.weaknesses[0].value}` : null,
              resistance: card.resistances?.[0] ? `${card.resistances[0].type} ${card.resistances[0].value}` : null,
              retreatCost: card.retreatCost?.length ?? null,
            },
          },
        },
        update: { name: card.name, imageUrl: card.images.small, marketPrice: price, rarity: POKEMON_RARITY_MAP[card.rarity ?? ""] ?? "RARE" },
      });
      count++;
    } catch (e) {
      // skip duplicates
    }
  }
  console.log(`    ✓ ${count} Pokemon cards`);
  return count;
}

// ─── Yu-Gi-Oh! ─────────────────────────────────────────────

const YGO_RARITY_MAP: Record<string, PrismaRarity> = {
  Common: "COMMON", Rare: "RARE", "Super Rare": "SUPER_RARE",
  "Ultra Rare": "ULTRA_RARE", "Secret Rare": "SECRET_RARE",
  "Ghost Rare": "SPECIAL", "Starlight Rare": "SPECIAL",
};

async function importYugiohBatch(offset: number, num: number) {
  console.log(`  Importing Yu-Gi-Oh! cards (offset ${offset}, num ${num})...`);
  const res = await fetch(`https://db.ygoprodeck.com/api/v7/cardinfo.php?num=${num}&offset=${offset}`);
  if (!res.ok) { console.error(`    Failed: ${res.status}`); return 0; }
  const json = await res.json();
  let count = 0;
  for (const card of json.data) {
    const set = card.card_sets?.[0];
    const img = card.card_images?.[0];
    const price = card.card_prices?.[0]?.tcgplayer_price ? parseFloat(card.card_prices[0].tcgplayer_price) || null : null;
    try {
      await prisma.card.upsert({
        where: { id: `yugioh-${card.id}` },
        create: {
          id: `yugioh-${card.id}`, externalId: String(card.id), name: card.name,
          gameType: "YUGIOH", setName: set?.set_name ?? null, setCode: set?.set_code ?? null,
          rarity: YGO_RARITY_MAP[set?.set_rarity ?? ""] ?? "RARE",
          imageUrl: img?.image_url_small ?? null, marketPrice: price,
          yugiohDetails: {
            create: {
              cardType: card.type ?? null, attribute: card.attribute ?? null,
              level: card.level ?? null, attack: card.atk ?? null, defense: card.def ?? null,
              race: card.race ?? null, archetype: card.archetype ?? null,
            },
          },
        },
        update: { name: card.name, imageUrl: img?.image_url_small ?? null, marketPrice: price },
      });
      count++;
    } catch (e) {
      // skip duplicates
    }
  }
  console.log(`    ✓ ${count} Yu-Gi-Oh! cards`);
  return count;
}

// ─── MTG ────────────────────────────────────────────────────

const MTG_RARITY_MAP: Record<string, PrismaRarity> = {
  common: "COMMON", uncommon: "UNCOMMON", rare: "RARE", mythic: "ULTRA_RARE", special: "SPECIAL", bonus: "SPECIAL",
};

async function importMtgSet(setCode: string) {
  console.log(`  Importing MTG set: ${setCode}...`);
  let count = 0;
  let url: string | null = `https://api.scryfall.com/cards/search?q=set:${setCode}&order=set`;
  while (url) {
    await new Promise((r) => setTimeout(r, 150)); // Scryfall rate limit
    const res: Response = await fetch(url);
    if (!res.ok) { console.error(`    Failed: ${res.status}`); break; }
    const json = await res.json();
    for (const card of json.data) {
      const imageUrl = card.image_uris?.small ?? card.card_faces?.[0]?.image_uris?.small ?? null;
      const price = card.prices?.usd ? parseFloat(card.prices.usd) || null : null;
      try {
        await prisma.card.upsert({
          where: { id: `mtg-${card.id}` },
          create: {
            id: `mtg-${card.id}`, externalId: card.id, name: card.name,
            gameType: "MTG", setName: card.set_name, setCode: card.set,
            rarity: MTG_RARITY_MAP[card.rarity] ?? "RARE",
            imageUrl, marketPrice: price,
            mtgDetails: {
              create: {
                manaCost: card.mana_cost ?? null, cmc: card.cmc ?? null,
                colors: card.colors ?? [], typeLine: card.type_line ?? null,
                oracleText: card.oracle_text ?? null, power: card.power ?? null,
                toughness: card.toughness ?? null, loyalty: card.loyalty ?? null,
              },
            },
          },
          update: { name: card.name, imageUrl, marketPrice: price },
        });
        count++;
      } catch (e) {
        // skip duplicates
      }
    }
    url = json.has_more ? json.next_page : null;
  }
  console.log(`    ✓ ${count} MTG cards`);
  return count;
}

// ─── Main ───────────────────────────────────────────────────

async function main() {
  console.log("=== Seeding cards from real APIs ===\n");
  let total = 0;

  // Pokemon — 3 popular sets
  console.log("Pokemon TCG:");
  total += await importPokemonSet("sv8");  // Surging Sparks
  total += await importPokemonSet("sv7");  // Stellar Crown
  total += await importPokemonSet("sv3pt5"); // 151 (classic Kanto)
  await new Promise((r) => setTimeout(r, 500));

  // Yu-Gi-Oh! — 200 iconic cards
  console.log("\nYu-Gi-Oh!:");
  total += await importYugiohBatch(0, 100);
  total += await importYugiohBatch(100, 100);

  // MTG — 3 recent sets
  console.log("\nMagic: The Gathering:");
  total += await importMtgSet("dsk"); // Duskmourn
  total += await importMtgSet("blb"); // Bloomburrow
  total += await importMtgSet("otj"); // Outlaws of Thunder Junction

  console.log(`\n=== Done! Total cards imported: ${total} ===`);
  await prisma.$disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
