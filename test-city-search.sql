-- Test city search performance with prefix match
EXPLAIN ANALYZE
SELECT slug, content
FROM entities
WHERE type = 'provider'
  AND (content -> 'address' ->> 'city') ILIKE 'Los Angeles%'
LIMIT 10;
