-- Performance indexes for FK columns and compound queries
CREATE INDEX IF NOT EXISTS "collection_cards_cardId_idx" ON "collection_cards"("cardId");
CREATE INDEX IF NOT EXISTS "wishlist_cards_cardId_idx" ON "wishlist_cards"("cardId");
CREATE INDEX IF NOT EXISTS "deck_cards_cardId_idx" ON "deck_cards"("cardId");
CREATE INDEX IF NOT EXISTS "listings_userId_status_idx" ON "listings"("userId", "status");
CREATE INDEX IF NOT EXISTS "listings_cardId_status_idx" ON "listings"("cardId", "status");
CREATE INDEX IF NOT EXISTS "transactions_listingId_idx" ON "transactions"("listingId");
