-- Fast search with clean snippet extraction
-- Snippets come ONLY from title and description - never from raw JSON/metadata
-- This prevents internal field names from appearing in search results

DROP FUNCTION IF EXISTS search_entities_grouped(text, int);

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
  category text,
  snippet text,
  rank real,
  type_total_count bigint
)
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  search_query tsquery;
BEGIN
  search_query := websearch_to_tsquery('english', query_text);

  RETURN QUERY
  WITH all_matches AS (
    SELECT
      CASE
        WHEN e.type = 'condition' THEN 'condition'::text
        WHEN e.type = 'resource' THEN 'resource'::text
        ELSE 'treatment'::text
      END as entity_type,
      e.id,
      e.type,
      e.slug,
      e.title,
      e.description,
      COALESCE(e.category, e.metadata->>'category')::text as category,
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
    r.entity_type::text,
    r.id,
    r.type::varchar(50),
    r.slug::varchar(255),
    r.title::varchar(500),
    r.description::text,
    r.category::text,
    -- Clean snippet: ONLY use title and description, nothing else
    (CASE 
      WHEN r.description IS NOT NULL AND length(trim(r.description)) > 10 
      THEN substring(r.description from 1 for 200)
      ELSE r.title::text
    END)::text as snippet,
    r.search_rank::real as rank,
    r.type_count::bigint as type_total_count
  FROM ranked_and_counted r
  WHERE r.rn <= limit_per_type
  ORDER BY r.entity_type, r.search_rank DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION search_entities_grouped(text, int) TO anon;
GRANT EXECUTE ON FUNCTION search_entities_grouped(text, int) TO authenticated;

COMMENT ON FUNCTION search_entities_grouped IS 'Fast search - snippets from title/description only, never from JSON metadata';
