-- Add treatment_approaches to search_vector for conditions
-- This ensures medications mentioned in treatment_approaches are searchable

DROP TRIGGER IF EXISTS trg_entities_search_vector ON entities;

-- Update trigger function to index treatment_approaches for conditions
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
        -- Condition-specific fields - CORRECT PATHS with content->'content'->...
        setweight(to_tsvector('english', coalesce(NEW.content->'content'->>'description', '')), 'B') ||
        setweight(to_tsvector('english', coalesce(NEW.content->'content'->>'overview', '')), 'B') ||
        setweight(to_tsvector('english', coalesce(NEW.content->'content'->'symptoms'->>'physical', '')), 'D') ||
        setweight(to_tsvector('english', coalesce(NEW.content->'content'->'symptoms'->>'emotional', '')), 'D') ||
        setweight(to_tsvector('english', coalesce(NEW.content->'content'->'symptoms'->>'behavioral', '')), 'D') ||
        setweight(to_tsvector('english', coalesce(NEW.content->'content'->'symptoms'->>'cognitive', '')), 'D') ||
        -- Treatment approaches (includes medication mentions) - THIS WAS MISSING!
        setweight(
          to_tsvector('english',
            coalesce(
              (
                SELECT string_agg(med, ' ')
                FROM jsonb_array_elements_text(NEW.content->'content'->'treatment_approaches'->'medications') AS med
              ),
              ''
            )
          ),
          'C'
        ) ||
        setweight(
          to_tsvector('english',
            coalesce(
              (
                SELECT string_agg(therapy, ' ')
                FROM jsonb_array_elements_text(NEW.content->'content'->'treatment_approaches'->'psychotherapy') AS therapy
              ),
              ''
            )
          ),
          'D'
        ) ||
        -- Real-life examples
        setweight(
          to_tsvector('english',
            coalesce(
              (
                SELECT string_agg(example, ' ')
                FROM jsonb_array_elements_text(NEW.content->'content'->'real_life_examples') AS example
              ),
              ''
            )
          ),
          'D'
        ) ||
        -- Self-help strategies
        setweight(
          to_tsvector('english',
            coalesce(
              (
                SELECT string_agg(strategy, ' ')
                FROM jsonb_array_elements_text(NEW.content->'content'->'self_help_strategies') AS strategy
              ),
              ''
            )
          ),
          'D'
        )

      WHEN NEW.type = 'resource' THEN
        -- Resource-specific fields - CORRECT PATHS with content->'content'->...
        setweight(to_tsvector('english', coalesce(NEW.content->>'summary', '')), 'B') ||
        setweight(to_tsvector('english', coalesce(NEW.content->>'patient_summary', '')), 'B') ||
        setweight(to_tsvector('english', coalesce(NEW.content->>'description', '')), 'B') ||
        setweight(to_tsvector('english', coalesce(NEW.content->>'how_it_helps', '')), 'D') ||
        setweight(to_tsvector('english', coalesce(NEW.content->'content'->>'introduction', '')), 'D') ||
        setweight(to_tsvector('english', coalesce(NEW.content->'content'->>'conclusion', '')), 'D') ||
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
        -- Content sections (for knowledge hub articles) - CORRECT PATH
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

COMMENT ON FUNCTION update_search_vector IS 'Updates search_vector with correct paths: conditions include treatment_approaches.medications, resources use content.sections (not content.content.sections)';
