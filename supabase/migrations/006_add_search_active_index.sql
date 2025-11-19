-- Add a more selective GIN index to support the search_entities function.
-- The existing idx_entities_search_vector index only filters on type,
-- so the planner still scans inactive rows. This version also filters on
-- status = 'active', matching the query predicate exactly.

CREATE INDEX IF NOT EXISTS idx_entities_search_vector_active
ON entities USING GIN (search_vector)
WHERE type <> 'provider' AND status = 'active';
