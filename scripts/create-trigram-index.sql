-- Enable pg_trgm extension for fast pattern matching with ILIKE
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Drop old index if it exists (B-tree doesn't help with ILIKE '%...%')
DROP INDEX IF EXISTS idx_entities_provider_full_name;

-- Create GIN trigram index for fast ILIKE searches
CREATE INDEX idx_entities_provider_full_name_trgm
ON entities USING gin ((content->>'full_name') gin_trgm_ops)
WHERE type = 'provider';

-- Update statistics
ANALYZE entities;

-- Test the query (should be much faster now)
EXPLAIN ANALYZE
SELECT slug, content
FROM entities
WHERE type = 'provider'
  AND content->>'full_name' ILIKE '%tinklenberg%'
LIMIT 10;
