-- AlterEnum: Add EXPIRED to OfferStatus (idempotent — already applied in partial run)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'EXPIRED' AND enumtypid = '"OfferStatus"'::regtype) THEN
    ALTER TYPE "OfferStatus" ADD VALUE 'EXPIRED';
  END IF;
END $$;

-- AlterTable: CollectionCard - add language, foil, forSale, forTrade, acquiredPrice, acquiredAt
-- Make condition non-nullable with default (idempotent)
ALTER TABLE "collection_cards" ALTER COLUMN "condition" SET DEFAULT 'Near Mint';
UPDATE "collection_cards" SET "condition" = 'Near Mint' WHERE "condition" IS NULL;
ALTER TABLE "collection_cards" ALTER COLUMN "condition" SET NOT NULL;

ALTER TABLE "collection_cards" ADD COLUMN IF NOT EXISTS "language" TEXT NOT NULL DEFAULT 'EN';
ALTER TABLE "collection_cards" ADD COLUMN IF NOT EXISTS "foil" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "collection_cards" ADD COLUMN IF NOT EXISTS "forSale" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "collection_cards" ADD COLUMN IF NOT EXISTS "forTrade" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "collection_cards" ADD COLUMN IF NOT EXISTS "acquiredPrice" DECIMAL(10,2);
ALTER TABLE "collection_cards" ADD COLUMN IF NOT EXISTS "acquiredAt" TIMESTAMP(3);

-- Drop old unique index and add new one (Prisma creates unique indexes, not constraints)
DROP INDEX IF EXISTS "collection_cards_collectionId_cardId_key";
CREATE UNIQUE INDEX IF NOT EXISTS "collection_cards_collectionId_cardId_language_foil_condition_key" ON "collection_cards"("collectionId", "cardId", "language", "foil", "condition");

-- AlterTable: Listing - add currency, language, photos
ALTER TABLE "listings" ADD COLUMN IF NOT EXISTS "currency" TEXT NOT NULL DEFAULT 'EUR';
ALTER TABLE "listings" ADD COLUMN IF NOT EXISTS "language" TEXT NOT NULL DEFAULT 'EN';
ALTER TABLE "listings" ADD COLUMN IF NOT EXISTS "photos" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- AlterTable: Offer - add expiresAt
ALTER TABLE "offers" ADD COLUMN IF NOT EXISTS "expiresAt" TIMESTAMP(3);

-- CreateIndex: partial index for offer expiry cron
CREATE INDEX IF NOT EXISTS "offers_status_expiresAt_idx" ON "offers"("status", "expiresAt");

-- CreateTable: ShippingZone
CREATE TABLE IF NOT EXISTS "shipping_zones" (
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
CREATE INDEX IF NOT EXISTS "shipping_zones_listingId_idx" ON "shipping_zones"("listingId");
CREATE UNIQUE INDEX IF NOT EXISTS "shipping_zones_listingId_zone_key" ON "shipping_zones"("listingId", "zone");

-- AddForeignKey
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'shipping_zones_listingId_fkey') THEN
    ALTER TABLE "shipping_zones" ADD CONSTRAINT "shipping_zones_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
