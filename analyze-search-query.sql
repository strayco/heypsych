-- Analyze search query performance

-- 1. Check if search_vector column is populated
SELECT
  type,
  COUNT(*) as total,
  COUNT(search_vector) as has_search_vector,
  COUNT(*) - COUNT(search_vector) as missing_search_vector
FROM entities
WHERE status = 'active' AND type <> 'provider'
GROUP BY type
ORDER BY type;

-- 2. Check indexes on entities table
SELECT
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'entities'
ORDER BY indexname;

-- 3. EXPLAIN ANALYZE for the search query (anxiety + treatment)
EXPLAIN (ANALYZE, BUFFERS, VERBOSE)
SELECT
  e.*,
  COUNT(*) OVER() as total_count
FROM entities e
WHERE e.type <> 'provider'
  AND e.status = 'active'
  AND e.search_vector @@ websearch_to_tsquery('english', 'anxiety')
  AND (
    'treatment' IS NULL OR
    ('treatment' = 'condition' AND e.type = 'condition') OR
    ('treatment' = 'resource' AND e.type = 'resource') OR
    ('treatment' = 'treatment' AND e.type NOT IN ('condition', 'resource', 'provider'))
  )
ORDER BY ts_rank(e.search_vector, websearch_to_tsquery('english', 'anxiety')) DESC
LIMIT 5
OFFSET 0;

-- 4. Check table statistics
SELECT
  schemaname,
  relname,
  n_live_tup,
  n_dead_tup,
  last_vacuum,
  last_autovacuum,
  last_analyze,
  last_autoanalyze
FROM pg_stat_user_tables
WHERE relname = 'entities';

-- 5. Sample search_vector content to verify it's working
SELECT
  type,
  title,
  LENGTH(search_vector::text) as search_vector_length,
  LEFT(search_vector::text, 100) as search_vector_sample
FROM entities
WHERE status = 'active' AND type <> 'provider'
LIMIT 5;
