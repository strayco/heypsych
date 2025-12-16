-- Enhance search to support brand name → generic name expansion
-- When searching for "Zoloft", also search for "sertraline" to find related conditions

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
  rank real,
  type_total_count bigint
)
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  search_query tsquery;
  expanded_query tsquery;
  generic_names text[];
BEGIN
  -- Compute the primary tsquery
  search_query := websearch_to_tsquery('english', query_text);

  -- Check if the search term matches any medication brand names
  -- If so, also search for the generic name (title)
  SELECT ARRAY_AGG(DISTINCT e.title)
  INTO generic_names
  FROM entities e
  WHERE e.type IN ('medication', 'supplement', 'treatment')
    AND e.status = 'active'
    AND EXISTS (
      SELECT 1
      FROM jsonb_array_elements_text(e.metadata->'brand_names') AS brand
      WHERE LOWER(brand) = LOWER(query_text)
    );

  -- If we found generic names, expand the search query
  IF array_length(generic_names, 1) > 0 THEN
    -- Combine original query with generic name searches using OR
    expanded_query := search_query;
    FOR i IN 1..array_length(generic_names, 1) LOOP
      expanded_query := expanded_query || websearch_to_tsquery('english', generic_names[i]);
    END LOOP;
  ELSE
    expanded_query := search_query;
  END IF;

  -- Return results for all three types with expanded query
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
      ts_rank(e.search_vector, expanded_query) as search_rank
    FROM entities e
    WHERE e.type <> 'provider'
      AND e.status = 'active'
      AND e.search_vector @@ expanded_query
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

-- Update permissions
GRANT EXECUTE ON FUNCTION search_entities_grouped(text, int) TO anon;
GRANT EXECUTE ON FUNCTION search_entities_grouped(text, int) TO authenticated;

COMMENT ON FUNCTION search_entities_grouped IS 'Enhanced search with brand name → generic name expansion. Searching for "Zoloft" will also find conditions mentioning "sertraline".';
