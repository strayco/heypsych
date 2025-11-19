-- Optimize search performance
-- This migration addresses the key performance bottlenecks:
-- 1. Reduces redundant tsquery computations (from 3x to 1x per query)
-- 2. Returns only necessary fields (not full content/metadata JSONB)
-- 3. Creates a grouped search function to reduce HTTP/RPC overhead from 3 calls to 1
-- 4. Optimizes the count calculation

-- First, optimize the individual search_entities function
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
BEGIN
  -- Compute the tsquery once instead of multiple times
  search_query := websearch_to_tsquery('english', query_text);

  -- Return paginated results with total count
  RETURN QUERY
  WITH matching_entities AS (
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
      ts_rank(e.search_vector, search_query) as rank
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
    ORDER BY rank DESC
    LIMIT limit_count
    OFFSET offset_count
  ),
  total AS (
    SELECT COUNT(*) as cnt
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
  )
  SELECT
    m.id,
    m.type,
    m.slug,
    m.title,
    m.description,
    m.content,
    m.metadata,
    m.status,
    m.created_at,
    m.updated_at,
    m.category,
    m.subcategory,
    m.search_vector,
    t.cnt as total_count
  FROM matching_entities m
  CROSS JOIN total t;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION search_entities(text, int, int, text) TO anon;
GRANT EXECUTE ON FUNCTION search_entities(text, int, int, text) TO authenticated;

-- Create a new grouped search function that returns all three categories at once
-- This eliminates the need for 3 separate RPC calls, reducing HTTP/PostgREST overhead
CREATE OR REPLACE FUNCTION search_entities_grouped(
  query_text text,
  limit_per_type int DEFAULT 5
)
RETURNS TABLE (
  entity_type text,
  id uuid,
  type varchar(50),
  slug varchar(255),
  title varchar(500),
  description text,
  -- Return only essential metadata fields, not full JSONB
  category text,
  -- For ranking
  rank real,
  -- Total count for this entity type
  type_total_count bigint
)
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  search_query tsquery;
BEGIN
  -- Compute the tsquery once
  search_query := websearch_to_tsquery('english', query_text);

  -- Return results for all three types with a single table scan
  RETURN QUERY
  WITH all_matches AS (
    SELECT
      CASE
        WHEN e.type = 'condition' THEN 'condition'
        WHEN e.type = 'resource' THEN 'resource'
        ELSE 'treatment'
      END as entity_type,
      e.id,
      e.type,
      e.slug,
      e.title,
      e.description,
      COALESCE(e.category, e.metadata->>'category') as category,
      ts_rank(e.search_vector, search_query) as search_rank
    FROM entities e
    WHERE e.type <> 'provider'
      AND e.status = 'active'
      AND e.search_vector @@ search_query
  ),
  ranked_and_counted AS (
    SELECT
      m.entity_type,
      m.id,
      m.type,
      m.slug,
      m.title,
      m.description,
      m.category,
      m.search_rank,
      ROW_NUMBER() OVER (PARTITION BY m.entity_type ORDER BY m.search_rank DESC) as rn,
      COUNT(*) OVER (PARTITION BY m.entity_type) as type_count
    FROM all_matches m
  )
  SELECT
    r.entity_type,
    r.id,
    r.type,
    r.slug,
    r.title,
    r.description,
    r.category,
    r.search_rank as rank,
    r.type_count as type_total_count
  FROM ranked_and_counted r
  WHERE r.rn <= limit_per_type
  ORDER BY r.entity_type, r.search_rank DESC;
END;
$$;

-- Grant permissions for the grouped search
GRANT EXECUTE ON FUNCTION search_entities_grouped(text, int) TO anon;
GRANT EXECUTE ON FUNCTION search_entities_grouped(text, int) TO authenticated;

-- Add a comment explaining the optimization
COMMENT ON FUNCTION search_entities_grouped IS 'Optimized search function that returns results for all entity types (condition, treatment, resource) in a single call, reducing HTTP/RPC overhead by 66%';
