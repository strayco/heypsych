-- Improves provider directory filtering performance (e.g., state=CA)
-- Adds expression indexes on commonly filtered JSON fields

-- Ensure pg_trgm is available for any future text search optimizations
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- State filter (matches UPPER(...) logic in API)
CREATE INDEX IF NOT EXISTS idx_entities_provider_state
  ON entities (UPPER((content -> 'address' ->> 'state')))
  WHERE type = 'provider';

-- ZIP filter
CREATE INDEX IF NOT EXISTS idx_entities_provider_zip
  ON entities ((content -> 'address' ->> 'zip'))
  WHERE type = 'provider';

-- Specialty array containment (GIN index for @> queries via .contains)
CREATE INDEX IF NOT EXISTS idx_entities_provider_specialties
  ON entities USING GIN ((content -> 'specialties'))
  WHERE type = 'provider';
