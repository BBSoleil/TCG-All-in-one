-- Upgrade card image URLs from small/thumbnail to full resolution.
-- Idempotent: each UPDATE has a WHERE guard to skip already-upgraded rows.
-- Run in Supabase SQL Editor.

-- 1. MTG (Scryfall): /small/ → /normal/
UPDATE "Card"
SET "imageUrl" = REPLACE("imageUrl", '/small/', '/normal/')
WHERE "gameType" = 'MTG'
  AND "imageUrl" LIKE '%cards.scryfall.io%/small/%';

-- 2. Pokemon (pokemontcg.io): images.small → images.large
--    Small URLs contain /images/small/ path. Large URLs use /images/large/.
UPDATE "Card"
SET "imageUrl" = REPLACE("imageUrl", '/images/small/', '/images/large/')
WHERE "gameType" = 'POKEMON'
  AND "imageUrl" LIKE '%images.pokemontcg.io%/images/small/%';

-- 3. Yu-Gi-Oh! (YGOProDeck): /cards_small/ → /cards/
UPDATE "Card"
SET "imageUrl" = REPLACE("imageUrl", '/cards_small/', '/cards/')
WHERE "gameType" = 'YUGIOH'
  AND "imageUrl" LIKE '%images.ygoprodeck.com%/cards_small/%';
