-- CreateIndex
CREATE INDEX IF NOT EXISTS "cards_gameType_setName_idx" ON "cards"("gameType", "setName");
