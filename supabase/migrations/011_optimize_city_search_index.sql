-- Migration 011: Skipped - index creation times out on large tables
-- Run manually in Supabase dashboard if needed:
-- CREATE INDEX IF NOT EXISTS idx_entities_provider_city_prefix
--   ON entities ((LOWER(content -> 'address' ->> 'city')) text_pattern_ops)
--   WHERE type = 'provider';

SELECT 1; -- no-op
