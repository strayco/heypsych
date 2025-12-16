-- Add content back to search but at lowest priority (weight D)
-- This allows matching on content while prioritizing title/description matches

CREATE OR REPLACE FUNCTION update_search_vector()
RETURNS TRIGGER AS $$
DECLARE
  content_tags text;
BEGIN
  -- Extract only top-level tags from content
  content_tags := COALESCE(
    (SELECT string_agg(value::text, ' ') FROM jsonb_array_elements_text(NEW.content->'tags')),
    ''
  );

  -- Build search vector:
  -- A: title (highest priority - exact name matches)
  -- B: description (main content users see)
  -- C: top-level tags (keywords)
  -- D: slug and content (catch-all for matches in article body, etc.)
  NEW.search_vector :=
    setweight(to_tsvector('english', coalesce(NEW.title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(NEW.description, '')), 'B') ||
    setweight(to_tsvector('english', content_tags), 'C') ||
    setweight(to_tsvector('english', coalesce(NEW.slug, '')), 'D') ||
    setweight(to_tsvector('english', coalesce(NEW.content::text, '')), 'D');

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION update_search_vector IS 'Direct search prioritizing title/description, with content as fallback';
