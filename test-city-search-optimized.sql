-- Test city search with LOWER() to use the index
EXPLAIN ANALYZE
SELECT slug, content
FROM entities
WHERE type = 'provider'
  AND LOWER(content -> 'address' ->> 'city') LIKE LOWER('Los Angeles%')
LIMIT 10;
