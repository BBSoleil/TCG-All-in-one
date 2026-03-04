-- Add GIN index for full-text search on card names
CREATE INDEX IF NOT EXISTS "cards_name_search_idx" ON "cards" USING GIN (to_tsvector('english', "name"));

-- Also add a trigram index for partial/fuzzy matching
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX IF NOT EXISTS "cards_name_trgm_idx" ON "cards" USING GIN ("name" gin_trgm_ops);
