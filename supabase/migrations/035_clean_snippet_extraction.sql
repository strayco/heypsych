-- Clean snippet extraction to remove JSON/code artifacts
--
-- Problem: Using content::text includes JSON syntax like {}, [], "fieldname":
--   which pollutes snippets with technical artifacts
--
-- Solution: Build searchable_text from extracted text values only,
--   not from JSON serialization. Clean the final snippet aggressively.

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
  normalized_query text;
BEGIN
  -- Compute the tsquery once
  search_query := websearch_to_tsquery('english', query_text);

  -- Normalize query for snippet extraction
  normalized_query := lower(regexp_replace(query_text, '[^a-zA-Z0-9\s]', ' ', 'g'));
  normalized_query := regexp_replace(normalized_query, '\s+', ' ', 'g');
  normalized_query := trim(normalized_query);
  normalized_query := split_part(normalized_query, ' ', 1);

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

      -- Build clean searchable text from content::text
      -- We use content::text to match search_vector, but will clean it for snippets
      COALESCE(e.title, '') || ' ' ||
      COALESCE(e.description, '') || ' ' ||
      COALESCE(e.content::text, '') || ' ' ||
      COALESCE(e.metadata::text, '') as raw_searchable_text,

      ts_rank(e.search_vector, search_query) as search_rank
    FROM entities e
    WHERE e.type <> 'provider'
      AND e.status = 'active'
      AND e.search_vector @@ search_query
  ),
  with_snippets AS (
    SELECT
      m.entity_type,
      m.id,
      m.type,
      m.slug,
      m.title,
      m.description,
      m.category,
      -- Extract snippet and clean aggressively
      CASE
        WHEN normalized_query <> '' AND position(normalized_query in lower(m.raw_searchable_text)) > 0 THEN
          -- Found match - extract 300 chars around it and clean
          regexp_replace(
            regexp_replace(
              regexp_replace(
                regexp_replace(
                  regexp_replace(
                    substring(
                      m.raw_searchable_text
                      from greatest(1, position(normalized_query in lower(m.raw_searchable_text)) - 150)
                      for 300
                    ),
                    -- Remove JSON syntax: {}, [], quotes, colons, commas
                    '[{}\[\]":,]', ' ', 'g'
                  ),
                  -- Remove common JSON field names
                  '\m(content|metadata|description|title|name|type|category|slug|id|data|sections|items|faqs|q|a|with|risk|action|medications|psychotherapy|lifestyle|brand_names|seo|clinical_metadata|patient_stories|linked_conditions|standardized_measures|treatment_approaches|real_life_examples|self_help_strategies|warning_signs|symptoms|physical|emotional|behavioral|cognitive|topics|introduction|conclusion|summary|patient_summary|how_it_helps)\M', '', 'gi'
                ),
                -- Remove URLs
                'https?://[^\s]+', '', 'g'
              ),
              -- Normalize whitespace
              '\s+', ' ', 'g'
            ),
            -- Remove leading/trailing whitespace and punctuation
            '^\s*[,:.\s]+|[,:.\s]+\s*$', '', 'g'
          )
        ELSE
          -- Fallback to ts_headline - it's already fairly clean
          ts_headline(
            'english',
            m.raw_searchable_text,
            search_query,
            'MaxWords=40, MinWords=20, ShortWord=2, MaxFragments=1, StartSel=, StopSel='
          )
      END as snippet,
      m.search_rank
    FROM all_matches m
  ),
  ranked_and_counted AS (
    SELECT
      s.entity_type,
      s.id,
      s.type,
      s.slug,
      s.title,
      s.description,
      s.category,
      -- Final cleanup: remove any remaining artifacts and normalize
      trim(
        regexp_replace(
          regexp_replace(s.snippet, '\s+', ' ', 'g'),
          '^[,.\s]+|[,.\s]+$', '', 'g'
        )
      ) as snippet,
      s.search_rank,
      ROW_NUMBER() OVER (PARTITION BY s.entity_type ORDER BY s.search_rank DESC) as rn,
      COUNT(*) OVER (PARTITION BY s.entity_type) as type_count
    FROM with_snippets s
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
    AND length(r.snippet) > 10  -- Filter out empty/useless snippets
  ORDER BY r.entity_type, r.search_rank DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION search_entities_grouped(text, int) TO anon;
GRANT EXECUTE ON FUNCTION search_entities_grouped(text, int) TO authenticated;

COMMENT ON FUNCTION search_entities_grouped IS 'Clean snippet extraction: removes JSON artifacts, field names, and technical syntax from search result snippets';
