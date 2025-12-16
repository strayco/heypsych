-- Fix snippet extraction to match actual search hit location
--
-- Problem: search_vector indexes entire content JSON (including FAQs, interactions)
--          but snippets only extract from top-level fields (patient_summary, description)
--          Result: search matches deep content but snippet doesn't show the matching term
--
-- Solution: Create a searchable_text field that concatenates all user-friendly text
--           Then use that same field for both search indexing AND snippet extraction

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
          -- Conditions: All searchable content including FAQs, examples, etc.
          COALESCE(e.title, '') || ' ' ||
          COALESCE(e.description, '') || ' ' ||
          COALESCE(e.content->'content'->>'description', '') || ' ' ||
          COALESCE(e.content->'content'->>'overview', '') || ' ' ||
          COALESCE(e.content->'content'->'symptoms'->>'physical', '') || ' ' ||
          COALESCE(e.content->'content'->'symptoms'->>'emotional', '') || ' ' ||
          COALESCE(e.content->'content'->'symptoms'->>'behavioral', '') || ' ' ||
          COALESCE(e.content->'content'->'symptoms'->>'cognitive', '') || ' ' ||
          -- FAQs
          COALESCE(
            (
              SELECT string_agg(
                COALESCE(faq->>'q', '') || ' ' || COALESCE(faq->>'a', ''),
                ' '
              )
              FROM jsonb_array_elements(e.content->'content'->'faqs') AS faq
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
          )

        WHEN e.type = 'resource' THEN
          -- Resources: All searchable content including topics, content sections, FAQs
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
          -- Content sections (knowledge hub articles)
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
              FROM jsonb_array_elements(e.content->'interactions') AS interaction
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
          -- Found the search term - extract 200 chars around it
          substring(
            m.searchable_text
            from greatest(1, position(lower(substring(query_text from 1 for 50)) in lower(m.searchable_text)) - 100)
            for 200
          )
        ELSE
          -- Fallback to ts_headline if position search fails
          ts_headline(
            'english',
            m.searchable_text,
            search_query,
            'MaxWords=30, MinWords=15, ShortWord=2, MaxFragments=1, StartSel=<b>, StopSel=</b>'
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

COMMENT ON FUNCTION search_entities_grouped IS 'Search with snippet extraction from same source as search matches (title + description + key content fields + brand names)';
