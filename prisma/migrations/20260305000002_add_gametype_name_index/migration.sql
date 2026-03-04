-- CreateIndex
CREATE INDEX IF NOT EXISTS "cards_gameType_name_idx" ON "cards"("gameType", "name");
