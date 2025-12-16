-- Extract meaningful content for snippets instead of raw JSON conversion
-- Build readable text from structured content fields

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
  -- Compute the tsquery once - simple, literal search
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
      -- Extract snippet from clean, readable text only
      -- Build searchable text from structured fields, not raw JSON
      ts_headline(
        'english',
        -- Description and title (always clean)
        COALESCE(e.description, '') || ' ' ||
        COALESCE(e.title, '') || ' ' ||
        -- Tags (clean text array)
        COALESCE(
          (SELECT string_agg(value::text, ' ') FROM jsonb_array_elements_text(e.content->'tags')),
          ''
        ) || ' ' ||
        -- Summary field (clean text)
        COALESCE(e.content->>'summary', '') || ' ' ||
        -- For articles/resources: body sections as plain text
        COALESCE(
          (SELECT string_agg(section->>'content', ' ')
           FROM jsonb_array_elements(e.content->'sections') AS section),
          ''
        ) || ' ' ||
        -- For conditions: treatment medications as plain text list
        COALESCE(
          (SELECT string_agg(value::text, ' ')
           FROM jsonb_array_elements_text(e.content->'treatment_approaches'->'medications')),
          ''
        ) || ' ' ||
        -- Real life examples (plain text)
        COALESCE(
          (SELECT string_agg(value::text, ' ')
           FROM jsonb_array_elements_text(e.content->'real_life_examples')),
          ''
        ),
        search_query,
        'MaxWords=20, MinWords=10, ShortWord=3, MaxFragments=1, HighlightAll=false, StartSel=<b>, StopSel=</b>'
      ) as snippet,
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
      m.snippet,
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
    r.snippet,
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

COMMENT ON FUNCTION search_entities_grouped IS 'Search with clean snippet extraction from structured content fields only';
