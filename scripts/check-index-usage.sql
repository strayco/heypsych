-- Check if indexes exist
SELECT
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'entities'
  AND (indexname LIKE '%provider%' OR indexname LIKE '%full_name%')
ORDER BY indexname;

-- Check query execution plan to see if index is being used
EXPLAIN ANALYZE
SELECT slug, content
FROM entities
WHERE type = 'provider'
  AND content->>'full_name' ILIKE '%tinklenberg%'
LIMIT 10;
