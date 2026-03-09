-- Covering partial index for getSetsForGame groupBy query
-- Enables index-only scan for GROUP BY (setName, setCode, gameType) WHERE setName IS NOT NULL
CREATE INDEX CONCURRENTLY IF NOT EXISTS "cards_sets_groupby_idx"
  ON "cards" ("setName", "setCode", "gameType")
  WHERE "setName" IS NOT NULL;
