-- CreateIndex
CREATE INDEX IF NOT EXISTS "collection_cards_collectionId_idx" ON "collection_cards"("collectionId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "wishlist_cards_userId_idx" ON "wishlist_cards"("userId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "deck_cards_deckId_idx" ON "deck_cards"("deckId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "offers_status_idx" ON "offers"("status");
