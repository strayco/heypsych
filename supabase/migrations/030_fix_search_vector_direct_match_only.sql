-- Fix search_vector to only index direct match content (no interactions, examples, warnings)
--
-- Problem: search_vector indexes entire content JSON (content::text) which includes:
--          - Drug interactions (mentions other medications)
--          - Real-life examples (mentions other medications)
--          - Warnings (mentions other substances)
--          This causes false positives where entities match but aren't actually ABOUT the search term
--
-- Solution: Update trigger to only index descriptive fields that define what the entity IS:
--          - Title, description, summary, patient_summary
--          - Brand names (for medications)
--          - FAQs (entity describing itself, even if comparing to others)
--          - SEO description (entity summary)
--          BUT NOT: interactions, examples, warnings (just reference other terms)

-- Drop existing trigger
DROP TRIGGER IF EXISTS trg_entities_search_vector ON entities;

-- Create new trigger function that indexes only descriptive fields
CREATE OR REPLACE FUNCTION update_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  -- Build search vector from descriptive fields only
  -- Weight: A = highest (title), B = high (descriptions), C = medium (slug, brand names), D = lower (FAQs, SEO)
  NEW.search_vector :=
    -- Core fields (all entity types)
    setweight(to_tsvector('english', coalesce(NEW.title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(NEW.description, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(NEW.slug, '')), 'C') ||

    -- Type-specific descriptive fields
    CASE
      WHEN NEW.type = 'condition' THEN
        -- Condition-specific fields
        setweight(to_tsvector('english', coalesce(NEW.content->'content'->>'description', '')), 'B') ||
        setweight(to_tsvector('english', coalesce(NEW.content->'content'->>'overview', '')), 'B') ||
        setweight(to_tsvector('english', coalesce(NEW.content->'content'->'symptoms'->>'physical', '')), 'D') ||
        setweight(to_tsvector('english', coalesce(NEW.content->'content'->'symptoms'->>'emotional', '')), 'D') ||
        setweight(to_tsvector('english', coalesce(NEW.content->'content'->'symptoms'->>'behavioral', '')), 'D') ||
        setweight(to_tsvector('english', coalesce(NEW.content->'content'->'symptoms'->>'cognitive', '')), 'D') ||
        -- Condition FAQs
        setweight(
          to_tsvector('english',
            coalesce(
              (
                SELECT string_agg(
                  coalesce(faq->>'q', '') || ' ' || coalesce(faq->>'a', ''),
                  ' '
                )
                FROM jsonb_array_elements(NEW.content->'content'->'faqs') AS faq
              ),
              ''
            )
          ),
          'D'
        )

      WHEN NEW.type = 'resource' THEN
        -- Resource-specific fields
        setweight(to_tsvector('english', coalesce(NEW.content->>'summary', '')), 'B') ||
        setweight(to_tsvector('english', coalesce(NEW.content->>'patient_summary', '')), 'B') ||
        setweight(to_tsvector('english', coalesce(NEW.content->>'description', '')), 'B') ||
        setweight(to_tsvector('english', coalesce(NEW.content->>'how_it_helps', '')), 'D') ||
        -- Topics (indicates what the resource is about)
        setweight(
          to_tsvector('english',
            coalesce(
              (
                SELECT string_agg(topic, ' ')
                FROM jsonb_array_elements_text(NEW.metadata->'topics') AS topic
              ),
              ''
            )
          ),
          'B'
        ) ||
        -- Content sections (for knowledge hub articles)
        setweight(
          to_tsvector('english',
            coalesce(
              (
                SELECT string_agg(
                  coalesce(section->>'heading', '') || ' ' || coalesce(section->>'content', ''),
                  ' '
                )
                FROM jsonb_array_elements(NEW.content->'content'->'sections') AS section
              ),
              ''
            )
          ),
          'D'
        ) ||
        -- Introduction (for knowledge hub articles)
        setweight(to_tsvector('english', coalesce(NEW.content->'content'->>'introduction', '')), 'D') ||
        -- Resource FAQs
        setweight(
          to_tsvector('english',
            coalesce(
              (
                SELECT string_agg(
                  coalesce(faq->>'q', '') || ' ' || coalesce(faq->>'a', ''),
                  ' '
                )
                FROM jsonb_array_elements(NEW.content->'faqs') AS faq
              ),
              ''
            )
          ),
          'D'
        )

      WHEN NEW.type NOT IN ('condition', 'resource', 'provider') THEN
        -- Treatment-specific fields (all treatment types)
        setweight(to_tsvector('english', coalesce(NEW.content->>'patient_summary', '')), 'B') ||
        setweight(to_tsvector('english', coalesce(NEW.content->>'description', '')), 'B') ||
        setweight(to_tsvector('english', coalesce(NEW.content->>'summary', '')), 'B') ||
        -- Brand names (important for medication matching: "Xanax" -> alprazolam)
        setweight(
          to_tsvector('english',
            coalesce(
              (
                SELECT string_agg(brand_name, ' ')
                FROM jsonb_array_elements_text(NEW.content->'metadata'->'brand_names') AS brand_name
              ),
              ''
            )
          ),
          'C'
        ) ||
        -- Treatment FAQs (entity describing itself, even if comparing to others)
        setweight(
          to_tsvector('english',
            coalesce(
              (
                SELECT string_agg(
                  coalesce(faq->>'q', '') || ' ' || coalesce(faq->>'a', ''),
                  ' '
                )
                FROM jsonb_array_elements(NEW.content->'faqs') AS faq
              ),
              ''
            )
          ),
          'D'
        ) ||
        -- SEO description (often good summary of the entity)
        setweight(to_tsvector('english', coalesce(NEW.content->'seo'->>'description', '')), 'D')

      ELSE
        -- Default for providers (excluded from search)
        to_tsvector('english', '')
    END;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Re-create trigger
CREATE TRIGGER trg_entities_search_vector
  BEFORE INSERT OR UPDATE ON entities
  FOR EACH ROW
  EXECUTE FUNCTION update_search_vector();

-- Re-index all existing entities (this may take a few minutes for large datasets)
-- We update in batches to avoid lock contention
DO $$
DECLARE
  batch_size INT := 100;
  offset_val INT := 0;
  updated_count INT;
BEGIN
  LOOP
    -- Update a batch of entities (excluding providers as they use different search)
    UPDATE entities
    SET updated_at = updated_at  -- Trigger will fire and update search_vector
    WHERE id IN (
      SELECT id FROM entities
      WHERE type <> 'provider'
      ORDER BY id
      LIMIT batch_size
      OFFSET offset_val
    );

    GET DIAGNOSTICS updated_count = ROW_COUNT;
    EXIT WHEN updated_count = 0;

    offset_val := offset_val + batch_size;

    -- Log progress every 1000 records
    IF offset_val % 1000 = 0 THEN
      RAISE NOTICE 'Re-indexed % entities...', offset_val;
    END IF;
  END LOOP;

  RAISE NOTICE 'Search vector re-indexing complete. Total entities: %', offset_val;
END $$;

COMMENT ON FUNCTION update_search_vector IS 'Updates search_vector to index only descriptive content (no interactions, examples, warnings) for direct match searches';
