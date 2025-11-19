-- Fix search optimization
-- The grouped function was scanning too many rows. Revert to parallel calls
-- but optimize the individual search_entities function to avoid window function overhead

DROP FUNCTION IF EXISTS search_entities(text, int, int, text);

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
DECLARE
  search_query tsquery;
  total_cnt bigint;
BEGIN
  -- Compute the tsquery once instead of multiple times
  search_query := websearch_to_tsquery('english', query_text);

  -- Get total count first with a separate optimized query
  SELECT COUNT(*)
  INTO total_cnt
  FROM entities e
  WHERE e.type <> 'provider'
    AND e.status = 'active'
    AND e.search_vector @@ search_query
    AND (
      type_filter IS NULL OR
      (type_filter = 'condition' AND e.type = 'condition') OR
      (type_filter = 'resource' AND e.type = 'resource') OR
      (type_filter = 'treatment' AND e.type NOT IN ('condition', 'resource', 'provider'))
    );

  -- Return paginated results without COUNT(*) OVER() overhead
  RETURN QUERY
  SELECT
    e.id,
    e.type,
    e.slug,
    e.title,
    e.description,
    e.content,
    e.metadata,
    e.status,
    e.created_at,
    e.updated_at,
    e.category,
    e.subcategory,
    e.search_vector,
    total_cnt as total_count
  FROM entities e
  WHERE e.type <> 'provider'
    AND e.status = 'active'
    AND e.search_vector @@ search_query
    AND (
      type_filter IS NULL OR
      (type_filter = 'condition' AND e.type = 'condition') OR
      (type_filter = 'resource' AND e.type = 'resource') OR
      (type_filter = 'treatment' AND e.type NOT IN ('condition', 'resource', 'provider'))
    )
  ORDER BY ts_rank(e.search_vector, search_query) DESC
  LIMIT limit_count
  OFFSET offset_count;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION search_entities(text, int, int, text) TO anon;
GRANT EXECUTE ON FUNCTION search_entities(text, int, int, text) TO authenticated;

-- Keep the grouped function for potential future use but don't use it in production
-- (it's less efficient for common queries that match many rows)
