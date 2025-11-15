-- Check if the provider search indexes exist

SELECT
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'entities'
  AND indexname LIKE '%provider%'
ORDER BY indexname;

-- If the above returns empty, the indexes weren't created.
-- Run this to create them:

-- CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_entities_provider_full_name
-- ON entities ((content->>'full_name'))
-- WHERE type = 'provider';
--
-- CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_entities_provider_state
-- ON entities ((content->'address'->>'state'))
-- WHERE type = 'provider';
--
-- CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_entities_provider_city
-- ON entities ((content->'address'->>'city'))
-- WHERE type = 'provider';
--
-- ANALYZE entities;
