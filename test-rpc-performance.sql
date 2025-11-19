-- Test the actual RPC function performance

-- Reset statement_timeout to measure actual time
SET statement_timeout TO DEFAULT;

-- Test 1: Treatments search for "anxiety"
\timing on
EXPLAIN (ANALYZE, BUFFERS, TIMING)
SELECT * FROM search_entities('anxiety', 5, 0, 'treatment');

-- Test 2: Conditions search for "anxiety"
EXPLAIN (ANALYZE, BUFFERS, TIMING)
SELECT * FROM search_entities('anxiety', 5, 0, 'condition');

-- Test 3: Resources search for "anxiety"
EXPLAIN (ANALYZE, BUFFERS, TIMING)
SELECT * FROM search_entities('anxiety', 5, 0, 'resource');

-- Test 4: Run all three in sequence to measure total time
SELECT 'Starting treatment search' as status;
SELECT COUNT(*) FROM search_entities('anxiety', 5, 0, 'treatment');

SELECT 'Starting condition search' as status;
SELECT COUNT(*) FROM search_entities('anxiety', 5, 0, 'condition');

SELECT 'Starting resource search' as status;
SELECT COUNT(*) FROM search_entities('anxiety', 5, 0, 'resource');

-- Test 5: Check if websearch_to_tsquery is expensive
EXPLAIN ANALYZE
SELECT websearch_to_tsquery('english', 'anxiety');

-- Test 6: Check ts_rank performance
EXPLAIN (ANALYZE, BUFFERS)
SELECT
  title,
  ts_rank(search_vector, websearch_to_tsquery('english', 'anxiety')) as rank
FROM entities
WHERE type <> 'provider'
  AND status = 'active'
  AND search_vector @@ websearch_to_tsquery('english', 'anxiety')
  AND type NOT IN ('condition', 'resource', 'provider')
ORDER BY rank DESC
LIMIT 5;
