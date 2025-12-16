-- Fix snippet extraction for conditions and resources to use user-friendly text fields
-- instead of raw JSON conversion which shows internal structure
--
-- Problem: content::text conversion shows JSON syntax like "symptoms": "physical": "..."
-- Solution: Extract user-friendly fields (description, summary, patient_summary) for snippets

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

      -- Entity-type-specific snippet extraction from user-friendly fields
      -- This prevents raw JSON structure from appearing in search results
      ts_headline(
        'english',
        CASE
          -- Conditions: Extract from nested content.content.description (double nested structure)
          WHEN e.type = 'condition' THEN
            COALESCE(
              e.content->'content'->>'description',
              e.content->>'description',
              e.description,
              e.title,
              ''
            )
          -- Resources: Try description, summary, patient_summary, then title
          WHEN e.type = 'resource' THEN
            COALESCE(
              e.content->>'description',
              e.content->>'summary',
              e.content->>'patient_summary',
              e.description,
              e.title,
              ''
            )
          -- Treatments: Try patient_summary, description, summary, then title
          ELSE
            COALESCE(
              e.content->>'patient_summary',
              e.content->>'description',
              e.content->>'summary',
              e.description,
              e.title,
              ''
            )
        END,
        search_query,
        'MaxWords=40, MinWords=20, ShortWord=2, MaxFragments=1, HighlightAll=true, StartSel=<b>, StopSel=</b>'
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

COMMENT ON FUNCTION search_entities_grouped IS 'Search with entity-type-specific snippet extraction from user-friendly text fields (description, summary, patient_summary)';
