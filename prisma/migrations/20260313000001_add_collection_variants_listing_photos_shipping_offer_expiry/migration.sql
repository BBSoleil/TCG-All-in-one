-- AlterEnum: Add EXPIRED to OfferStatus
ALTER TYPE "OfferStatus" ADD VALUE 'EXPIRED';

-- AlterTable: CollectionCard - add language, foil, forSale, forTrade, acquiredPrice, acquiredAt
-- Make condition non-nullable with default
ALTER TABLE "collection_cards" ALTER COLUMN "condition" SET DEFAULT 'Near Mint';
UPDATE "collection_cards" SET "condition" = 'Near Mint' WHERE "condition" IS NULL;
ALTER TABLE "collection_cards" ALTER COLUMN "condition" SET NOT NULL;

ALTER TABLE "collection_cards" ADD COLUMN "language" TEXT NOT NULL DEFAULT 'EN';
ALTER TABLE "collection_cards" ADD COLUMN "foil" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "collection_cards" ADD COLUMN "forSale" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "collection_cards" ADD COLUMN "forTrade" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "collection_cards" ADD COLUMN "acquiredPrice" DECIMAL(10,2);
ALTER TABLE "collection_cards" ADD COLUMN "acquiredAt" TIMESTAMP(3);

-- Drop old unique constraint and add new one
ALTER TABLE "collection_cards" DROP CONSTRAINT "collection_cards_collectionId_cardId_key";
ALTER TABLE "collection_cards" ADD CONSTRAINT "collection_cards_collectionId_cardId_language_foil_condition_key" UNIQUE ("collectionId", "cardId", "language", "foil", "condition");

-- AlterTable: Listing - add currency, language, photos
ALTER TABLE "listings" ADD COLUMN "currency" TEXT NOT NULL DEFAULT 'EUR';
ALTER TABLE "listings" ADD COLUMN "language" TEXT NOT NULL DEFAULT 'EN';
ALTER TABLE "listings" ADD COLUMN "photos" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- AlterTable: Offer - add expiresAt
ALTER TABLE "offers" ADD COLUMN "expiresAt" TIMESTAMP(3);

-- CreateIndex: partial index for offer expiry cron
CREATE INDEX "offers_status_expiresAt_idx" ON "offers"("status", "expiresAt");

-- CreateTable: ShippingZone
CREATE TABLE "shipping_zones" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "zone" TEXT NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "estimatedMin" INTEGER NOT NULL,
    "estimatedMax" INTEGER NOT NULL,

    CONSTRAINT "shipping_zones_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "shipping_zones_listingId_idx" ON "shipping_zones"("listingId");
CREATE UNIQUE INDEX "shipping_zones_listingId_zone_key" ON "shipping_zones"("listingId", "zone");

-- AddForeignKey
ALTER TABLE "shipping_zones" ADD CONSTRAINT "shipping_zones_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
