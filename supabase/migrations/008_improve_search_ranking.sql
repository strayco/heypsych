-- Improve search ranking by extracting and boosting key content fields
-- This ensures treatments rank appropriately when searching for conditions they treat

CREATE OR REPLACE FUNCTION update_search_vector()
RETURNS TRIGGER AS $$
DECLARE
  content_tags text;
  content_searchable text;
  content_therapeutic text;
  content_primary_indications text;
BEGIN
  -- Extract important fields from content JSONB for better ranking
  content_tags := COALESCE(
    (SELECT string_agg(value::text, ' ') FROM jsonb_array_elements_text(NEW.content->'tags')),
    ''
  );

  content_searchable := COALESCE(
    (SELECT string_agg(value::text, ' ') FROM jsonb_array_elements_text(NEW.content->'search_metadata'->'searchable_terms')),
    ''
  );

  content_therapeutic := COALESCE(
    (SELECT string_agg(value::text, ' ') FROM jsonb_array_elements_text(NEW.metadata->'therapeutic_categories')),
    ''
  );

  content_primary_indications := COALESCE(
    (SELECT string_agg(value::text, ' ') FROM jsonb_array_elements_text(NEW.content->'clinical_metadata'->'primary_indications')),
    ''
  );

  -- Build search vector with improved weights:
  -- A: title (most important - exact name matches)
  -- B: description, extracted tags, searchable terms, therapeutic categories
  -- C: slug
  -- D: full content and metadata (catch-all) - but exclude category field for conditions
  IF NEW.type = 'condition' THEN
    -- For conditions, exclude category and file_path from metadata (internal categorization only)
    NEW.search_vector :=
      setweight(to_tsvector('english', coalesce(NEW.title, '')), 'A') ||
      setweight(to_tsvector('english', coalesce(NEW.description, '')), 'B') ||
      setweight(to_tsvector('english', content_tags), 'B') ||
      setweight(to_tsvector('english', content_searchable), 'B') ||
      setweight(to_tsvector('english', coalesce(NEW.slug, '')), 'C') ||
      setweight(to_tsvector('english', coalesce(NEW.content::text, '')), 'D') ||
      setweight(to_tsvector('english', coalesce((NEW.metadata - 'category' - 'file_path')::text, '')), 'D');
  ELSE
    -- For treatments and resources, include everything
    NEW.search_vector :=
      setweight(to_tsvector('english', coalesce(NEW.title, '')), 'A') ||
      setweight(to_tsvector('english', coalesce(NEW.description, '')), 'B') ||
      setweight(to_tsvector('english', content_tags), 'B') ||
      setweight(to_tsvector('english', content_searchable), 'B') ||
      setweight(to_tsvector('english', content_therapeutic), 'B') ||
      setweight(to_tsvector('english', content_primary_indications), 'B') ||
      setweight(to_tsvector('english', coalesce(NEW.slug, '')), 'C') ||
      setweight(to_tsvector('english', coalesce(NEW.content::text, '')), 'D') ||
      setweight(to_tsvector('english', coalesce(NEW.metadata::text, '')), 'D');
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Note: Run scripts/rebuild-search-vectors.sql separately to rebuild existing vectors
-- This avoids timeout issues during migration
