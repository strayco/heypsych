-- Enhance search_entities to support type filtering and return proper total count
-- This fixes pagination and performance issues with client-side type filtering

-- Drop both old and new function signatures
DROP FUNCTION IF EXISTS search_entities(text, int, int);
DROP FUNCTION IF EXISTS search_entities(text, int, int, text);

-- Create enhanced search function with type filtering using window function for count
CREATE OR REPLACE FUNCTION search_entities(
  query_text text,
  limit_count int DEFAULT 50,
  offset_count int DEFAULT 0,
  type_filter text DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  type varchar(50),
  slug varchar(255),
  title varchar(500),
  description text,
  content jsonb,
  metadata jsonb,
  status varchar(20),
  created_at timestamptz,
  updated_at timestamptz,
  category text,
  subcategory text,
  search_vector tsvector,
  total_count bigint
)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  -- Allow up to 10 seconds for the full-text search query
  PERFORM set_config('statement_timeout', '10000', true);

  -- Return paginated results with total count using window function
  -- Type filter maps broad categories: 'treatment', 'condition', 'resource'
  RETURN QUERY
  SELECT
    e.*,
    COUNT(*) OVER() as total_count
  FROM entities e
  WHERE e.type <> 'provider'
    AND e.status = 'active'
    AND e.search_vector @@ websearch_to_tsquery('english', query_text)
    AND (
      type_filter IS NULL OR
      (type_filter = 'condition' AND e.type = 'condition') OR
      (type_filter = 'resource' AND e.type = 'resource') OR
      (type_filter = 'treatment' AND e.type NOT IN ('condition', 'resource', 'provider'))
    )
  ORDER BY ts_rank(e.search_vector, websearch_to_tsquery('english', query_text)) DESC
  LIMIT limit_count
  OFFSET offset_count;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION search_entities(text, int, int, text) TO anon;
GRANT EXECUTE ON FUNCTION search_entities(text, int, int, text) TO authenticated;
