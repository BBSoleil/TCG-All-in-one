-- CreateEnum
CREATE TYPE "GameType" AS ENUM ('POKEMON', 'YUGIOH', 'MTG', 'ONEPIECE');

-- CreateEnum
CREATE TYPE "Rarity" AS ENUM ('COMMON', 'UNCOMMON', 'RARE', 'SUPER_RARE', 'ULTRA_RARE', 'SECRET_RARE', 'SPECIAL');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "passwordHash" TEXT,
    "image" TEXT,
    "emailVerified" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accounts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification_tokens" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "cards" (
    "id" TEXT NOT NULL,
    "externalId" TEXT,
    "name" TEXT NOT NULL,
    "gameType" "GameType" NOT NULL,
    "setName" TEXT,
    "setCode" TEXT,
    "rarity" "Rarity",
    "imageUrl" TEXT,
    "marketPrice" DECIMAL(10,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pokemon_card_details" (
    "id" TEXT NOT NULL,
    "cardId" TEXT NOT NULL,
    "hp" INTEGER,
    "types" TEXT[],
    "evolvesFrom" TEXT,
    "stage" TEXT,
    "weakness" TEXT,
    "resistance" TEXT,
    "retreatCost" INTEGER,

    CONSTRAINT "pokemon_card_details_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "yugioh_card_details" (
    "id" TEXT NOT NULL,
    "cardId" TEXT NOT NULL,
    "cardType" TEXT,
    "attribute" TEXT,
    "level" INTEGER,
    "attack" INTEGER,
    "defense" INTEGER,
    "race" TEXT,
    "archetype" TEXT,

    CONSTRAINT "yugioh_card_details_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mtg_card_details" (
    "id" TEXT NOT NULL,
    "cardId" TEXT NOT NULL,
    "manaCost" TEXT,
    "cmc" DOUBLE PRECISION,
    "colors" TEXT[],
    "typeLine" TEXT,
    "oracleText" TEXT,
    "power" TEXT,
    "toughness" TEXT,
    "loyalty" TEXT,

    CONSTRAINT "mtg_card_details_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "onepiece_card_details" (
    "id" TEXT NOT NULL,
    "cardId" TEXT NOT NULL,
    "color" TEXT,
    "cost" INTEGER,
    "power" INTEGER,
    "counter" INTEGER,
    "attribute" TEXT,
    "cardType" TEXT,

    CONSTRAINT "onepiece_card_details_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "collections" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "gameType" "GameType" NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "collections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "collection_cards" (
    "id" TEXT NOT NULL,
    "collectionId" TEXT NOT NULL,
    "cardId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "condition" TEXT,
    "notes" TEXT,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "collection_cards_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "accounts_provider_providerAccountId_key" ON "accounts"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_sessionToken_key" ON "sessions"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_token_key" ON "verification_tokens"("token");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_identifier_token_key" ON "verification_tokens"("identifier", "token");

-- CreateIndex
CREATE INDEX "cards_gameType_idx" ON "cards"("gameType");

-- CreateIndex
CREATE INDEX "cards_name_idx" ON "cards"("name");

-- CreateIndex
CREATE UNIQUE INDEX "pokemon_card_details_cardId_key" ON "pokemon_card_details"("cardId");

-- CreateIndex
CREATE UNIQUE INDEX "yugioh_card_details_cardId_key" ON "yugioh_card_details"("cardId");

-- CreateIndex
CREATE UNIQUE INDEX "mtg_card_details_cardId_key" ON "mtg_card_details"("cardId");

-- CreateIndex
CREATE UNIQUE INDEX "onepiece_card_details_cardId_key" ON "onepiece_card_details"("cardId");

-- CreateIndex
CREATE INDEX "collections_userId_idx" ON "collections"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "collection_cards_collectionId_cardId_key" ON "collection_cards"("collectionId", "cardId");

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pokemon_card_details" ADD CONSTRAINT "pokemon_card_details_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "cards"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "yugioh_card_details" ADD CONSTRAINT "yugioh_card_details_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "cards"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mtg_card_details" ADD CONSTRAINT "mtg_card_details_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "cards"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "onepiece_card_details" ADD CONSTRAINT "onepiece_card_details_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "cards"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "collections" ADD CONSTRAINT "collections_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "collection_cards" ADD CONSTRAINT "collection_cards_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "collections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "collection_cards" ADD CONSTRAINT "collection_cards_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "cards"("id") ON DELETE CASCADE ON UPDATE CASCADE;
