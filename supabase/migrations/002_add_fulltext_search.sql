-- Add full-text search to entities table
-- This migration adds search_vector column and GIN index for fast full-text search
-- Note: search_vector is populated via trigger on INSERT/UPDATE

-- Add searchable column (will be populated via trigger)
ALTER TABLE entities
ADD COLUMN IF NOT EXISTS search_vector tsvector;

-- Create partial GIN index for fast searches (excludes providers)
-- Providers have their own search via /api/providers/search
CREATE INDEX IF NOT EXISTS idx_entities_search_vector
ON entities USING GIN (search_vector)
WHERE type <> 'provider';

-- Add index on type + status for filtering (if not exists)
CREATE INDEX IF NOT EXISTS idx_entities_type_status
ON entities(type, status);

-- Create search function that returns full entity rows
-- Explicitly excludes providers from global search
CREATE OR REPLACE FUNCTION search_entities(
  query_text text,
  limit_count int DEFAULT 50,
  offset_count int DEFAULT 0
)
RETURNS SETOF entities
LANGUAGE sql
STABLE
AS $$
  SELECT *
  FROM entities
  WHERE type <> 'provider'
    AND status = 'active'
    AND search_vector @@ websearch_to_tsquery('english', query_text)
  ORDER BY ts_rank(search_vector, websearch_to_tsquery('english', query_text)) DESC
  LIMIT limit_count
  OFFSET offset_count;
$$;

-- Create trigger function to auto-update search_vector on INSERT/UPDATE
CREATE OR REPLACE FUNCTION update_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', coalesce(NEW.title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(NEW.description, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(NEW.slug, '')), 'C') ||
    setweight(to_tsvector('english', coalesce(NEW.content::text, '')), 'D') ||
    setweight(to_tsvector('english', coalesce(NEW.metadata::text, '')), 'D');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update search_vector
DROP TRIGGER IF EXISTS trg_entities_search_vector ON entities;
CREATE TRIGGER trg_entities_search_vector
  BEFORE INSERT OR UPDATE ON entities
  FOR EACH ROW
  EXECUTE FUNCTION update_search_vector();

-- Populate search_vector for existing rows
-- Run scripts/populate-search-vector.sql separately for large datasets
-- This avoids timeout issues during migration
