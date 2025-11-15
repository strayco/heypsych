-- Add full-text search to entities table
-- This migration adds a generated tsvector column and GIN index for fast full-text search

-- Add searchable column (auto-updated)
ALTER TABLE entities
ADD COLUMN IF NOT EXISTS search_vector tsvector
GENERATED ALWAYS AS (
  setweight(to_tsvector('english', coalesce(name, '')), 'A') ||
  setweight(to_tsvector('english', coalesce(description, '')), 'B') ||
  setweight(to_tsvector('english', coalesce(slug, '')), 'C') ||
  setweight(to_tsvector('english', coalesce(metadata::text, '')), 'D')
) STORED;

-- Create GIN index for fast searches
CREATE INDEX IF NOT EXISTS idx_entities_search_vector
ON entities USING GIN (search_vector);

-- Add index on type + status for filtering
CREATE INDEX IF NOT EXISTS idx_entities_type_status
ON entities(type, status);

-- Add index on slug for lookups
CREATE INDEX IF NOT EXISTS idx_entities_slug_unique
ON entities(slug);

-- Create search function
CREATE OR REPLACE FUNCTION search_entities(
  query_text text,
  limit_count int DEFAULT 50,
  offset_count int DEFAULT 0
)
RETURNS TABLE (
  id uuid,
  type text,
  slug text,
  name text,
  description text,
  metadata jsonb,
  rank real
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    e.id,
    e.type,
    e.slug,
    e.name,
    e.description,
    e.metadata,
    ts_rank(e.search_vector, websearch_to_tsquery('english', query_text)) as rank
  FROM entities e
  WHERE
    e.status = 'active'
    AND e.search_vector @@ websearch_to_tsquery('english', query_text)
  ORDER BY rank DESC
  LIMIT limit_count
  OFFSET offset_count;
END;
$$ LANGUAGE plpgsql STABLE;
