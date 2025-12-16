-- Simplify search to be direct and literal only
-- Only search title, description, and basic tags - no deep JSON content
-- This ensures "adderall" only matches if it's in the main visible text

-- Update the search_vector trigger to only include user-visible fields
CREATE OR REPLACE FUNCTION update_search_vector()
RETURNS TRIGGER AS $$
DECLARE
  content_tags text;
BEGIN
  -- Extract only top-level tags from content (not deep nested fields)
  content_tags := COALESCE(
    (SELECT string_agg(value::text, ' ') FROM jsonb_array_elements_text(NEW.content->'tags')),
    ''
  );

  -- Build search vector with only direct, visible fields:
  -- A: title (most important - exact name matches)
  -- B: description (main content users see)
  -- C: top-level tags (keywords)
  -- D: slug (for URL-based searches)
  -- NO LONGER SEARCHING: full content JSON, metadata, nested fields
  NEW.search_vector :=
    setweight(to_tsvector('english', coalesce(NEW.title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(NEW.description, '')), 'B') ||
    setweight(to_tsvector('english', content_tags), 'C') ||
    setweight(to_tsvector('english', coalesce(NEW.slug, '')), 'D');

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Rebuild all search vectors with the new simplified logic
UPDATE entities
SET updated_at = updated_at
WHERE type <> 'provider';

COMMENT ON FUNCTION update_search_vector IS 'Simplified direct search - only searches title, description, and top-level tags';
