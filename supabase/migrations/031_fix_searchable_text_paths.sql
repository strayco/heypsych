-- Fix searchable_text construction to include treatment_approaches for conditions
--
-- Problem: Migration 029 was missing content->'content'->'treatment_approaches'
--   This is where medications like "fluoxetine" are mentioned in condition pages
--
-- Solution: Add treatment_approaches to searchable_text for conditions

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

      -- Build searchable text that includes ALL user-visible content
      -- This ensures search matches and snippet extraction use the same source
      CASE
        WHEN e.type = 'condition' THEN
          -- Conditions: All searchable content including treatment mentions, examples, etc.
          COALESCE(e.title, '') || ' ' ||
          COALESCE(e.description, '') || ' ' ||
          COALESCE(e.content->'content'->>'description', '') || ' ' ||
          COALESCE(e.content->'content'->>'overview', '') || ' ' ||
          -- Symptoms (all types)
          COALESCE(e.content->'content'->'symptoms'->>'physical', '') || ' ' ||
          COALESCE(e.content->'content'->'symptoms'->>'emotional', '') || ' ' ||
          COALESCE(e.content->'content'->'symptoms'->>'behavioral', '') || ' ' ||
          COALESCE(e.content->'content'->'symptoms'->>'cognitive', '') || ' ' ||
          -- Treatment approaches (includes medication mentions like "fluoxetine") - THIS WAS MISSING IN 029!
          COALESCE(
            (
              SELECT string_agg(med, ' ')
              FROM jsonb_array_elements_text(e.content->'content'->'treatment_approaches'->'medications') AS med
            ),
            ''
          ) || ' ' ||
          COALESCE(
            (
              SELECT string_agg(therapy, ' ')
              FROM jsonb_array_elements_text(e.content->'content'->'treatment_approaches'->'psychotherapy') AS therapy
            ),
            ''
          ) || ' ' ||
          COALESCE(
            (
              SELECT string_agg(lifestyle, ' ')
              FROM jsonb_array_elements_text(e.content->'content'->'treatment_approaches'->'lifestyle_interventions') AS lifestyle
            ),
            ''
          ) || ' ' ||
          -- Real-life examples (may mention medications)
          COALESCE(
            (
              SELECT string_agg(example, ' ')
              FROM jsonb_array_elements_text(e.content->'content'->'real_life_examples') AS example
            ),
            ''
          ) || ' ' ||
          -- Self-help strategies
          COALESCE(
            (
              SELECT string_agg(strategy, ' ')
              FROM jsonb_array_elements_text(e.content->'content'->'self_help_strategies') AS strategy
            ),
            ''
          ) || ' ' ||
          -- Warning signs
          COALESCE(
            (
              SELECT string_agg(sign, ' ')
              FROM jsonb_array_elements_text(e.content->'content'->'warning_signs') AS sign
            ),
            ''
          ) || ' ' ||
          -- FAQs (from migration 029)
          COALESCE(
            (
              SELECT string_agg(
                COALESCE(faq->>'q', '') || ' ' || COALESCE(faq->>'a', ''),
                ' '
              )
              FROM jsonb_array_elements(e.content->'content'->'faqs') AS faq
            ),
            ''
          )

        WHEN e.type = 'resource' THEN
          -- Resources: All searchable content including topics, content sections (from migration 029 - paths are correct)
          COALESCE(e.title, '') || ' ' ||
          COALESCE(e.description, '') || ' ' ||
          COALESCE(e.content->>'summary', '') || ' ' ||
          COALESCE(e.content->>'patient_summary', '') || ' ' ||
          COALESCE(e.content->>'description', '') || ' ' ||
          COALESCE(e.content->>'how_it_helps', '') || ' ' ||
          -- Topics (what the resource is about)
          COALESCE(
            (
              SELECT string_agg(topic, ' ')
              FROM jsonb_array_elements_text(e.metadata->'topics') AS topic
            ),
            ''
          ) || ' ' ||
          -- Content sections (for knowledge hub articles) - CORRECT PATH
          COALESCE(
            (
              SELECT string_agg(
                COALESCE(section->>'heading', '') || ' ' || COALESCE(section->>'content', ''),
                ' '
              )
              FROM jsonb_array_elements(e.content->'content'->'sections') AS section
            ),
            ''
          ) || ' ' ||
          -- Introduction
          COALESCE(e.content->'content'->>'introduction', '') || ' ' ||
          -- Conclusion
          COALESCE(e.content->'content'->>'conclusion', '') || ' ' ||
          -- FAQs
          COALESCE(
            (
              SELECT string_agg(
                COALESCE(faq->>'q', '') || ' ' || COALESCE(faq->>'a', ''),
                ' '
              )
              FROM jsonb_array_elements(e.content->'faqs') AS faq
            ),
            ''
          )

        ELSE
          -- Treatments: ALL content (FAQs, brand names, SEO, interactions, warnings, etc.)
          COALESCE(e.title, '') || ' ' ||
          COALESCE(e.description, '') || ' ' ||
          COALESCE(e.content->>'patient_summary', '') || ' ' ||
          COALESCE(e.content->>'description', '') || ' ' ||
          COALESCE(e.content->>'summary', '') || ' ' ||
          -- Brand names
          COALESCE(
            (
              SELECT string_agg(brand_name, ' ')
              FROM jsonb_array_elements_text(e.content->'metadata'->'brand_names') AS brand_name
            ),
            ''
          ) || ' ' ||
          -- FAQs
          COALESCE(
            (
              SELECT string_agg(
                COALESCE(faq->>'q', '') || ' ' || COALESCE(faq->>'a', ''),
                ' '
              )
              FROM jsonb_array_elements(e.content->'faqs') AS faq
            ),
            ''
          ) || ' ' ||
          -- SEO description
          COALESCE(e.content->'seo'->>'description', '') || ' ' ||
          -- Interactions (includes mentions of other drugs)
          COALESCE(
            (
              SELECT string_agg(
                COALESCE(interaction->>'with', '') || ' ' ||
                COALESCE(interaction->>'risk', '') || ' ' ||
                COALESCE(interaction->>'action', ''),
                ' '
              )
              FROM jsonb_array_elements(e.content->'sections') AS section
              CROSS JOIN LATERAL jsonb_array_elements(section->'items') AS interaction
              WHERE section->>'type' = 'interactions'
            ),
            ''
          ) || ' ' ||
          -- Side effects
          COALESCE(e.content->'side_effects'->>'common', '') || ' ' ||
          COALESCE(e.content->'side_effects'->>'serious', '') || ' ' ||
          -- Warnings and precautions
          COALESCE(
            (
              SELECT string_agg(warning, ' ')
              FROM jsonb_array_elements_text(e.content->'clinical_metadata'->'contraindications') AS warning
            ),
            ''
          ) || ' ' ||
          -- Patient stories (may mention other medications for comparison)
          COALESCE(
            (
              SELECT string_agg(
                COALESCE(story->>'experience', '') || ' ' ||
                COALESCE(
                  (SELECT string_agg(quote, ' ') FROM jsonb_array_elements_text(story->'quotes') AS quote),
                  ''
                ),
                ' '
              )
              FROM jsonb_array_elements(e.content->'patient_stories') AS story
            ),
            ''
          ) || ' ' ||
          -- Linked conditions context (mentions other medications for comparison)
          COALESCE(
            (
              SELECT string_agg(COALESCE(condition->>'context', ''), ' ')
              FROM jsonb_array_elements(e.content->'clinical_metadata'->'linked_conditions') AS condition
            ),
            ''
          )
      END as searchable_text,

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
      -- Manual snippet extraction: find where the query appears and extract context
      -- This is more reliable than ts_headline which prefers early fragments
      CASE
        WHEN position(lower(substring(query_text from 1 for 50)) in lower(m.searchable_text)) > 0 THEN
          -- Found the search term - extract 300 chars around it (increased from 200)
          substring(
            m.searchable_text
            from greatest(1, position(lower(substring(query_text from 1 for 50)) in lower(m.searchable_text)) - 150)
            for 300
          )
        ELSE
          -- Fallback to ts_headline if position search fails
          ts_headline(
            'english',
            m.searchable_text,
            search_query,
            'MaxWords=40, MinWords=20, ShortWord=2, MaxFragments=1, StartSel=<b>, StopSel=</b>'
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
      s.snippet,
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
  ORDER BY r.entity_type, r.search_rank DESC;
END;
$$;

-- Update permissions
GRANT EXECUTE ON FUNCTION search_entities_grouped(text, int) TO anon;
GRANT EXECUTE ON FUNCTION search_entities_grouped(text, int) TO authenticated;

COMMENT ON FUNCTION search_entities_grouped IS 'Search with correct JSON paths: conditions include treatment_approaches, resources include sections (no extra content level)';
