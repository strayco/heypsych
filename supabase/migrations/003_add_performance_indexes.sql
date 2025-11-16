-- Add performance indexes for common query patterns
-- Migration 003: Performance optimization indexes

-- Index for metadata->category (heavily used in treatment/condition filtering)
-- Using expression index for JSONB field extraction
CREATE INDEX IF NOT EXISTS idx_entities_metadata_category
ON entities ((metadata->>'category'));

-- Index for provider-specific searches
-- Create partial indexes only for provider type to reduce index size
CREATE INDEX IF NOT EXISTS idx_providers_full_name
ON entities ((content->>'full_name'))
WHERE type = 'provider';

CREATE INDEX IF NOT EXISTS idx_providers_state
ON entities ((content->'address'->>'state'))
WHERE type = 'provider';

CREATE INDEX IF NOT EXISTS idx_providers_city
ON entities ((content->'address'->>'city'))
WHERE type = 'provider';

-- GIN index for provider specialties array searches
-- Supports @> operator used in `.contains()` queries
CREATE INDEX IF NOT EXISTS idx_providers_specialties
ON entities USING GIN ((content->'specialties'))
WHERE type = 'provider';

-- Compound index for common provider query pattern (type + slug ordering)
CREATE INDEX IF NOT EXISTS idx_providers_slug
ON entities (slug)
WHERE type = 'provider';

-- Comment on indexes
COMMENT ON INDEX idx_entities_metadata_category IS 'Speeds up category filtering on treatments and conditions';
COMMENT ON INDEX idx_providers_full_name IS 'Speeds up provider name searches';
COMMENT ON INDEX idx_providers_state IS 'Speeds up provider state filtering';
COMMENT ON INDEX idx_providers_city IS 'Speeds up provider city filtering';
COMMENT ON INDEX idx_providers_specialties IS 'Speeds up provider specialty filtering (array contains)';
COMMENT ON INDEX idx_providers_slug IS 'Speeds up provider pagination ordering';
