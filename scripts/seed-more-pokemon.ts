import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const connectionString = process.env["DATABASE_URL"];
if (!connectionString) { console.error("DATABASE_URL required"); process.exit(1); }

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

type R = "COMMON" | "UNCOMMON" | "RARE" | "SUPER_RARE" | "ULTRA_RARE" | "SECRET_RARE" | "SPECIAL";
const RM: Record<string, R> = {
  Common: "COMMON", Uncommon: "UNCOMMON", Rare: "RARE",
  "Rare Holo": "RARE", "Rare Holo EX": "SUPER_RARE", "Rare Holo GX": "SUPER_RARE",
  "Rare Holo V": "SUPER_RARE", "Rare Ultra": "ULTRA_RARE", "Rare VMAX": "ULTRA_RARE",
  "Rare Secret": "SECRET_RARE", "Rare Rainbow": "SECRET_RARE",
  "Double Rare": "RARE", "Ultra Rare": "ULTRA_RARE",
  "Illustration Rare": "SPECIAL", "Special Art Rare": "SPECIAL",
  "Hyper Rare": "SECRET_RARE", "Rare Shiny": "SPECIAL", "Amazing Rare": "SPECIAL",
};

async function importSet(setId: string) {
  console.log(`Importing ${setId}...`);
  await new Promise(r => setTimeout(r, 3000));
  const res = await fetch(`https://api.pokemontcg.io/v2/cards?q=set.id:${setId}&pageSize=250`);
  if (!res.ok) { console.log(`  Failed: ${res.status}`); return; }
  const json = await res.json();
  let c = 0;
  for (const card of json.data) {
    const price = card.cardmarket?.prices?.averageSellPrice ?? null;
    try {
      await prisma.card.upsert({
        where: { id: `pokemon-${card.id}` },
        create: {
          id: `pokemon-${card.id}`, externalId: card.id, name: card.name,
          gameType: "POKEMON", setName: card.set.name, setCode: card.set.id,
          rarity: RM[card.rarity ?? ""] ?? "RARE",
          imageUrl: card.images.small, marketPrice: price,
          pokemonDetails: { create: {
            hp: card.hp ? parseInt(card.hp, 10) || null : null,
            types: card.types ?? [], evolvesFrom: card.evolvesFrom ?? null,
            stage: card.subtypes?.includes("Basic") ? "Basic" : card.subtypes?.includes("Stage 1") ? "Stage 1" : card.subtypes?.includes("Stage 2") ? "Stage 2" : card.subtypes?.[0] ?? null,
            weakness: card.weaknesses?.[0] ? `${card.weaknesses[0].type} ${card.weaknesses[0].value}` : null,
            resistance: card.resistances?.[0] ? `${card.resistances[0].type} ${card.resistances[0].value}` : null,
            retreatCost: card.retreatCost?.length ?? null,
          }},
        },
        update: { name: card.name, imageUrl: card.images.small, marketPrice: price },
      });
      c++;
    } catch { /* skip */ }
  }
  console.log(`  Done: ${c} cards`);
}

async function main() {
  await importSet("sv9");     // Journey Together
  await importSet("sv8pt5");  // Prismatic Evolutions
  await importSet("base1");   // Original Base Set
  await importSet("sv7");     // Stellar Crown (retry)

  const count = await prisma.card.count();
  console.log(`\nTotal cards in DB: ${count}`);
  await prisma.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
