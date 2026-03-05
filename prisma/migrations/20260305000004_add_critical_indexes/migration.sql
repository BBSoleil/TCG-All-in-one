-- Add missing FK indexes on Account and Session (auth performance)
CREATE INDEX IF NOT EXISTS "accounts_userId_idx" ON "accounts"("userId");
CREATE INDEX IF NOT EXISTS "sessions_userId_idx" ON "sessions"("userId");

-- Add User.isPublic index (leaderboard queries)
CREATE INDEX IF NOT EXISTS "users_isPublic_idx" ON "users"("isPublic");

-- Add Card.externalId index (import lookups)
CREATE INDEX IF NOT EXISTS "cards_externalId_idx" ON "cards"("externalId");

-- Add Card.marketPrice index (portfolio aggregations, leaderboards)
CREATE INDEX IF NOT EXISTS "cards_marketPrice_idx" ON "cards"("marketPrice");

-- Add UserRating FK indexes (seller rating aggregations)
CREATE INDEX IF NOT EXISTS "user_ratings_rateeId_idx" ON "user_ratings"("rateeId");
CREATE INDEX IF NOT EXISTS "user_ratings_raterId_idx" ON "user_ratings"("raterId");
