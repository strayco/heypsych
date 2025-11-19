-- Increase reliability of search_entities by giving PostgreSQL more time
-- to execute the full-text search before timing out. This recreates the
-- function in PL/pgSQL so we can SET a local statement_timeout without
-- changing any of the existing query logic or filters.

CREATE OR REPLACE FUNCTION search_entities(
  query_text text,
  limit_count int DEFAULT 50,
  offset_count int DEFAULT 0
)
RETURNS SETOF entities
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  -- Allow up to 10 seconds for the full-text search query
  PERFORM set_config('statement_timeout', '10000', true);

  RETURN QUERY
  SELECT *
  FROM entities
  WHERE type <> 'provider'
    AND status = 'active'
    AND search_vector @@ websearch_to_tsquery('english', query_text)
  ORDER BY ts_rank(search_vector, websearch_to_tsquery('english', query_text)) DESC
  LIMIT limit_count
  OFFSET offset_count;
END;
$$;
