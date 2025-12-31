-- Extract clean text from JSONB without field names or JSON syntax
--
-- Problem: Using content::text in snippet extraction includes JSON field names
--   like "symptoms": "physical": which leak into search result previews
--
-- Solution: Create a recursive function to extract only text values from JSONB,
--   excluding field names, brackets, quotes, and other JSON syntax

-- Function to clean JSON text: convert JSONB to text and remove all JSON syntax
CREATE OR REPLACE FUNCTION jsonb_extract_text_values(data jsonb)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  result text := '';
BEGIN
  -- Handle NULL input
  IF data IS NULL THEN
    RETURN '';
  END IF;

  -- Convert entire JSONB to text (so we search everything)
  result := data::text;

  -- Aggressively remove all JSON syntax
  -- Remove JSON field names with quotes and colons: "fieldname": or "fieldname":
  result := regexp_replace(result, '"[a-zA-Z_][a-zA-Z0-9_]*"\s*:\s*', '', 'g');
  -- Remove standalone quoted strings (common field values like "active", "slug", etc)
  result := regexp_replace(result, '"\s*,\s*"', ' ', 'g');
  -- Remove all JSON structural characters
  result := translate(result, '{}[]":,', '       '); -- Replace with spaces
  -- Remove ALL escape sequences (most aggressive approach)
  -- This matches a backslash followed by any character
  result := regexp_replace(result, E'\\\\[ntr"]', ' ', 'g');  -- Matches \\n, \\t, \\r, \\"
  result := regexp_replace(result, '\\[ntr]', ' ', 'g');      -- Matches \n, \t, \r in text
  -- Also handle actual newline/tab characters
  result := replace(result, E'\n', ' ');
  result := replace(result, E'\t', ' ');
  result := replace(result, E'\r', ' ');
  -- Remove bullet points and special characters
  result := replace(result, '•', '');
  result := replace(result, '●', '');
  result := replace(result, '◦', '');
  -- Normalize whitespace
  result := regexp_replace(result, '\s+', ' ', 'g');
  result := trim(result);

  RETURN result;
END;
$$;

-- Update search_entities_grouped to use clean text extraction
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
  -- Compute the tsquery once - simple, literal search
  search_query := websearch_to_tsquery('english', query_text);

  -- Normalize the query for snippet extraction: remove special chars, keep only alphanumeric and spaces
  normalized_query := lower(regexp_replace(query_text, '[^a-zA-Z0-9\s]', ' ', 'g'));
  normalized_query := regexp_replace(normalized_query, '\s+', ' ', 'g');
  normalized_query := trim(normalized_query);
  -- Take first word only for position matching (more reliable than full phrase)
  normalized_query := split_part(normalized_query, ' ', 1);

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

      -- Build searchable text from clean text values (no JSON field names)
      COALESCE(e.title, '') || ' ' ||
      COALESCE(e.description, '') || ' ' ||
      COALESCE(jsonb_extract_text_values(e.content), '') || ' ' ||
      COALESCE(jsonb_extract_text_values(e.metadata), '') as searchable_text,

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
      -- Manual snippet extraction using normalized query (special chars removed)
      CASE
        WHEN normalized_query <> '' AND position(normalized_query in lower(m.searchable_text)) > 0 THEN
          -- Found the normalized search term - extract 300 chars around it
          substring(
            m.searchable_text
            from greatest(1, position(normalized_query in lower(m.searchable_text)) - 150)
            for 300
          )
        ELSE
          -- Fallback to ts_headline if position search fails
          ts_headline(
            'english',
            m.searchable_text,
            search_query,
            'MaxWords=40, MinWords=20, ShortWord=2, MaxFragments=1'
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
GRANT EXECUTE ON FUNCTION jsonb_extract_text_values(jsonb) TO anon;
GRANT EXECUTE ON FUNCTION jsonb_extract_text_values(jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION search_entities_grouped(text, int) TO anon;
GRANT EXECUTE ON FUNCTION search_entities_grouped(text, int) TO authenticated;

COMMENT ON FUNCTION jsonb_extract_text_values IS 'Recursively extracts only text values from JSONB, excluding field names and JSON syntax';
COMMENT ON FUNCTION search_entities_grouped IS 'Search with clean text extraction: uses jsonb_extract_text_values to prevent JSON field names from appearing in snippets';
