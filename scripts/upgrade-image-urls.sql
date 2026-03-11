-- Upgrade card image URLs from small/thumbnail to full resolution.
-- Idempotent: each UPDATE has a WHERE guard to skip already-upgraded rows.
-- Run in Supabase SQL Editor.
-- Table name is lowercase "cards" (Prisma mapped).

-- 1. MTG (Scryfall): /small/ → /normal/
UPDATE cards
SET "imageUrl" = REPLACE("imageUrl", '/small/', '/normal/')
WHERE "gameType" = 'MTG'
  AND "imageUrl" LIKE '%cards.scryfall.io%/small/%';

-- 2. Pokemon (pokemontcg.io): .png → _hires.png
UPDATE cards
SET "imageUrl" = REPLACE("imageUrl", '.png', '_hires.png')
WHERE "gameType" = 'POKEMON'
  AND "imageUrl" LIKE '%images.pokemontcg.io%'
  AND "imageUrl" NOT LIKE '%_hires.png';

-- 3. Yu-Gi-Oh! (YGOProDeck): /cards_small/ → /cards/
UPDATE cards
SET "imageUrl" = REPLACE("imageUrl", '/cards_small/', '/cards/')
WHERE "gameType" = 'YUGIOH'
  AND "imageUrl" LIKE '%images.ygoprodeck.com%/cards_small/%';
