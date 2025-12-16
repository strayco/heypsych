-- Prioritize snippets that actually contain the search term
-- Previous version concatenated all text, causing ts_headline to show description even when match was elsewhere
-- New version tries each field individually and picks the first one with an actual match

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

      -- Try to generate snippets from different fields, prioritizing meaningful matches
      -- We'll select the FIRST field that actually contains the search term
      CASE
        -- Try title first (if it matches)
        WHEN to_tsvector('english', COALESCE(e.title, '')) @@ search_query THEN
          ts_headline(
            'english',
            e.title,
            search_query,
            'MaxWords=25, MinWords=5, ShortWord=3, MaxFragments=1'
          )
        -- Try description next
        WHEN to_tsvector('english', COALESCE(e.description, '')) @@ search_query THEN
          ts_headline(
            'english',
            e.description,
            search_query,
            'MaxWords=25, MinWords=5, ShortWord=3, MaxFragments=1'
          )
        -- Try summary
        WHEN to_tsvector('english', COALESCE(e.content->>'summary', e.content->'content'->>'summary', '')) @@ search_query THEN
          ts_headline(
            'english',
            COALESCE(e.content->>'summary', e.content->'content'->>'summary', ''),
            search_query,
            'MaxWords=25, MinWords=5, ShortWord=3, MaxFragments=1'
          )
        -- Try full content as last resort
        ELSE
          ts_headline(
            'english',
            -- Build full text from all fields
            COALESCE(e.description, '') || ' ' ||
            COALESCE(e.title, '') || ' ' ||
            COALESCE(e.content->>'summary', e.content->'content'->>'summary', '') || ' ' ||
            COALESCE(
              (SELECT string_agg(value::text, ' ') FROM jsonb_array_elements_text(e.content->'tags')),
              (SELECT string_agg(value::text, ' ') FROM jsonb_array_elements_text(e.content->'content'->'tags')),
              ''
            ) || ' ' ||
            COALESCE(
              (SELECT string_agg(section->>'content', ' ')
               FROM jsonb_array_elements(e.content->'sections') AS section),
              (SELECT string_agg(section->>'content', ' ')
               FROM jsonb_array_elements(e.content->'content'->'sections') AS section),
              ''
            ) || ' ' ||
            COALESCE(
              (SELECT string_agg(value::text, ' ')
               FROM jsonb_array_elements_text(e.content->'treatment_approaches'->'medications')),
              (SELECT string_agg(value::text, ' ')
               FROM jsonb_array_elements_text(e.content->'content'->'treatment_approaches'->'medications')),
              ''
            ) || ' ' ||
            COALESCE(
              (SELECT string_agg(value::text, ' ')
               FROM jsonb_array_elements_text(e.content->'real_life_examples')),
              (SELECT string_agg(value::text, ' ')
               FROM jsonb_array_elements_text(e.content->'content'->'real_life_examples')),
              ''
            ),
            search_query,
            'MaxWords=30, MinWords=10, ShortWord=2, MaxFragments=2, FragmentDelimiter= ... , HighlightAll=false, StartSel=<b>, StopSel=</b>'
          )
      END as snippet,

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

COMMENT ON FUNCTION search_entities_grouped IS 'Search with snippet prioritization - shows snippets from fields that actually match the search term';
