-- Populate search_vector for existing rows
-- Run this after adding the search_vector column or when data is missing
-- Processes in batches to avoid timeout on large tables

-- Batch 1: Update rows without search_vector (most critical)
WITH batch AS (
  SELECT id,
         setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
         setweight(to_tsvector('english', coalesce(description, '')), 'B') ||
         setweight(to_tsvector('english', coalesce(slug, '')), 'C') ||
         setweight(to_tsvector('english', coalesce(content::text, '')), 'D') ||
         setweight(to_tsvector('english', coalesce(metadata::text, '')), 'D') AS vector
  FROM entities
  WHERE search_vector IS NULL
    AND type <> 'provider'  -- Skip providers, they use separate search
  ORDER BY created_at DESC
  LIMIT 500
)
UPDATE entities e
SET search_vector = b.vector
FROM batch b
WHERE e.id = b.id;

-- Check how many remain
SELECT
  COUNT(*) as total_non_provider,
  COUNT(search_vector) as with_search_vector,
  COUNT(*) - COUNT(search_vector) as missing_search_vector
FROM entities
WHERE type <> 'provider';

-- If more than 0 missing, run this script again until all are populated
