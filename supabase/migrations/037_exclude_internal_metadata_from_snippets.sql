-- Exclude internal metadata fields from search snippets
--
-- Problem: Internal metadata fields like last_synced, wikidata_qid, categories, etc.
--   are appearing in search result snippets, causing confusing technical data to show
--
-- Solution: Filter out internal-only metadata fields before extracting text for snippets

-- Improved function to extract clean text from JSONB, excluding internal metadata fields
CREATE OR REPLACE FUNCTION jsonb_extract_text_values(data jsonb, exclude_keys text[] DEFAULT ARRAY[]::text[])
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  result text := '';
  filtered_data jsonb;
  key text;
BEGIN
  -- Handle NULL input
  IF data IS NULL THEN
    RETURN '';
  END IF;

  -- Filter out excluded keys if this is an object
  IF jsonb_typeof(data) = 'object' THEN
    filtered_data := '{}'::jsonb;
    FOR key IN SELECT jsonb_object_keys(data)
    LOOP
      -- Skip if key is in exclude list (case-insensitive)
      IF NOT (lower(key) = ANY(exclude_keys)) THEN
        filtered_data := filtered_data || jsonb_build_object(key, data->key);
      END IF;
    END LOOP;
  ELSE
    filtered_data := data;
  END IF;

  -- Convert to text
  result := filtered_data::text;

  -- Aggressively remove all JSON syntax and escape sequences
  -- Remove JSON field names with quotes and colons
  result := regexp_replace(result, '"[a-zA-Z_][a-zA-Z0-9_]*"\s*:\s*', '', 'g');
  -- Remove standalone quoted strings (common field values)
  result := regexp_replace(result, '"\s*,\s*"', ' ', 'g');
  -- Remove all JSON structural characters
  result := translate(result, '{}[]":,', '       ');
  -- Remove ALL escape sequences and newline representations
  result := regexp_replace(result, E'\\\\[ntr"]', ' ', 'g');  -- \\n, \\t, \\r, \\"
  result := regexp_replace(result, '\\[ntr]', ' ', 'g');      -- \n, \t, \r
  -- Also handle actual newline/tab/carriage return characters
  result := replace(result, E'\n', ' ');
  result := replace(result, E'\t', ' ');
  result := replace(result, E'\r', ' ');
  -- Remove bullet points and special characters
  result := regexp_replace(result, '[•●◦\u2022\u2023\u25E6\u2043\u2219]', '', 'g');
  -- Normalize whitespace
  result := regexp_replace(result, '\s+', ' ', 'g');
  result := trim(result);

  RETURN result;
END;
$$;

-- Update search_entities_grouped to exclude internal metadata fields from snippets
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
  -- Define internal metadata fields that should never appear in snippets
  internal_metadata_fields text[] := ARRAY[
    'last_synced', 'wikidata_qid', 'file_path', 'data_source',
    'sync_date', 'import_date', 'version', 'schema_version',
    'internal_id', 'legacy_id', 'migration_id'
  ];
BEGIN
  -- Compute the tsquery once - simple, literal search
  search_query := websearch_to_tsquery('english', query_text);

  -- Normalize the query for snippet extraction
  normalized_query := lower(regexp_replace(query_text, '[^a-zA-Z0-9\s]', ' ', 'g'));
  normalized_query := regexp_replace(normalized_query, '\s+', ' ', 'g');
  normalized_query := trim(normalized_query);
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

      -- Build searchable text from clean text values, excluding internal metadata
      COALESCE(e.title, '') || ' ' ||
      COALESCE(e.description, '') || ' ' ||
      COALESCE(jsonb_extract_text_values(e.content, ARRAY[]::text[]), '') || ' ' ||
      COALESCE(jsonb_extract_text_values(e.metadata, internal_metadata_fields), '') as searchable_text,

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
      -- Manual snippet extraction using normalized query
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
      -- Final cleanup of snippet
      trim(
        regexp_replace(
          -- Remove any remaining metadata field patterns
          regexp_replace(
            -- Remove timestamp patterns (ISO 8601)
            regexp_replace(
              s.snippet,
              '\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z?',
              '',
              'g'
            ),
            -- Remove common metadata field names that might remain
            '\m(categories|wikidata_qid|last_synced|file_path|data_source|sync_date|import_date|schema_version)\M',
            '',
            'gi'
          ),
          -- Normalize whitespace
          '\s+', ' ', 'g'
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
    AND length(trim(r.snippet)) > 10  -- Filter out empty/useless snippets
  ORDER BY r.entity_type, r.search_rank DESC;
END;
$$;

-- Update permissions
GRANT EXECUTE ON FUNCTION jsonb_extract_text_values(jsonb, text[]) TO anon;
GRANT EXECUTE ON FUNCTION jsonb_extract_text_values(jsonb, text[]) TO authenticated;
GRANT EXECUTE ON FUNCTION search_entities_grouped(text, int) TO anon;
GRANT EXECUTE ON FUNCTION search_entities_grouped(text, int) TO authenticated;

COMMENT ON FUNCTION jsonb_extract_text_values IS 'Extracts text values from JSONB while excluding specified internal metadata fields';
COMMENT ON FUNCTION search_entities_grouped IS 'Search with clean snippet extraction: excludes internal metadata fields like last_synced, wikidata_qid, etc.';
