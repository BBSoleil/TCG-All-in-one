import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const connectionString = process.env["DATABASE_URL"]
  ?.trim()
  .replace(/[?&]pgbouncer=true/g, "");

const pool = new Pool({ connectionString, max: 5, ssl: { rejectUnauthorized: false } });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const FERDINAND = "cmmkgmkgd0000wm6mpqfe0gey";
  const ED = "cmmknzcem000004jvx6nb2yxz";

  // Pick iconic cards with images for each game
  const charizard = await prisma.card.findFirst({
    where: { gameType: "POKEMON", name: { contains: "Charizard" }, imageUrl: { not: null } },
    select: { id: true, name: true, gameType: true, marketPrice: true },
  });
  const pikachu = await prisma.card.findFirst({
    where: { gameType: "POKEMON", name: { contains: "Pikachu" }, imageUrl: { not: null } },
    select: { id: true, name: true, gameType: true, marketPrice: true },
  });
  const blueEyes = await prisma.card.findFirst({
    where: { gameType: "YUGIOH", name: { contains: "Blue-Eyes White Dragon" }, imageUrl: { not: null } },
    select: { id: true, name: true, gameType: true, marketPrice: true },
  });
  const darkMagician = await prisma.card.findFirst({
    where: { gameType: "YUGIOH", name: { contains: "Dark Magician" }, imageUrl: { not: null } },
    select: { id: true, name: true, gameType: true, marketPrice: true },
  });
  const lightning = await prisma.card.findFirst({
    where: { gameType: "MTG", name: { contains: "Lightning Bolt" }, imageUrl: { not: null } },
    select: { id: true, name: true, gameType: true, marketPrice: true },
  });
  const luffy = await prisma.card.findFirst({
    where: { gameType: "ONEPIECE", name: { contains: "Luffy" }, imageUrl: { not: null } },
    select: { id: true, name: true, gameType: true, marketPrice: true },
  });

  const cards = [charizard, pikachu, blueEyes, darkMagician, lightning, luffy].filter(Boolean);
  console.log("Cards found:", cards.map(c => `${c!.name} (${c!.gameType})`));

  if (cards.length < 4) {
    console.error("Not enough cards found, aborting");
    return;
  }

  // Create collections for Ferdinand (buyer)
  const pokemonCol = await prisma.collection.upsert({
    where: { id: "demo-col-pokemon" },
    update: {},
    create: { id: "demo-col-pokemon", name: "My Pokemon Collection", userId: FERDINAND, gameType: "POKEMON" },
  });
  const yugiohCol = await prisma.collection.upsert({
    where: { id: "demo-col-yugioh" },
    update: {},
    create: { id: "demo-col-yugioh", name: "My Yu-Gi-Oh! Collection", userId: FERDINAND, gameType: "YUGIOH" },
  });
  const mtgCol = await prisma.collection.upsert({
    where: { id: "demo-col-mtg" },
    update: {},
    create: { id: "demo-col-mtg", name: "MTG Essentials", userId: FERDINAND, gameType: "MTG" },
  });
  const opCol = await prisma.collection.upsert({
    where: { id: "demo-col-onepiece" },
    update: {},
    create: { id: "demo-col-onepiece", name: "One Piece Starters", userId: FERDINAND, gameType: "ONEPIECE" },
  });
  console.log("Collections created:", [pokemonCol, yugiohCol, mtgCol, opCol].map(c => c.name));

  // Create decks for Ferdinand
  const pokemonDeck = await prisma.deck.upsert({
    where: { id: "demo-deck-pokemon" },
    update: {},
    create: { id: "demo-deck-pokemon", name: "Fire Deck", userId: FERDINAND, gameType: "POKEMON" },
  });
  const yugiohDeck = await prisma.deck.upsert({
    where: { id: "demo-deck-yugioh" },
    update: {},
    create: { id: "demo-deck-yugioh", name: "Dragon Deck", userId: FERDINAND, gameType: "YUGIOH" },
  });
  console.log("Decks created:", [pokemonDeck, yugiohDeck].map(d => d.name));

  // Create listings by Ed (seller) for each card, then transactions where Ferdinand (buyer) bought them
  const listingsData = [
    { card: charizard!, price: 45.00, condition: "Near Mint" },
    { card: pikachu!, price: 12.50, condition: "Lightly Played" },
    { card: blueEyes!, price: 35.00, condition: "Near Mint" },
    { card: darkMagician!, price: 20.00, condition: "Moderately Played" },
  ];

  if (lightning) {
    listingsData.push({ card: lightning, price: 5.00, condition: "Near Mint" });
  }
  if (luffy) {
    listingsData.push({ card: luffy, price: 8.00, condition: "Near Mint" });
  }

  for (let i = 0; i < listingsData.length; i++) {
    const { card, price, condition } = listingsData[i];
    const listingId = `demo-listing-${i + 1}`;
    const txId = `demo-tx-${i + 1}`;

    // Create SOLD listing
    await prisma.listing.upsert({
      where: { id: listingId },
      update: {},
      create: {
        id: listingId,
        userId: ED,
        cardId: card.id,
        price,
        condition,
        quantity: 1,
        isTradeOnly: false,
        status: "SOLD",
      },
    });

    // Create completed transaction
    await prisma.transaction.upsert({
      where: { id: txId },
      update: {},
      create: {
        id: txId,
        listingId,
        sellerId: ED,
        buyerId: FERDINAND,
        price,
        completedAt: new Date(Date.now() - (listingsData.length - i) * 24 * 3600 * 1000), // staggered dates
      },
    });

    console.log(`Transaction: Ferdinand bought ${card.name} from Ed for $${price}`);
  }

  console.log("\nDone! Visit http://localhost:3000/market/history to see the post-purchase actions.");

  await prisma.$disconnect();
  await pool.end();
}

main().catch(console.error);
