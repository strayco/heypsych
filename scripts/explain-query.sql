-- Run this in Supabase SQL Editor to see the query execution plan
-- This shows whether PostgreSQL is using the indexes

EXPLAIN ANALYZE
SELECT slug, content
FROM entities
WHERE type = 'provider'
  AND (content->'address'->>'state') = 'CA'
ORDER BY slug
LIMIT 50;
