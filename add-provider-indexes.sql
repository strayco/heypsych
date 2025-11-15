-- Database indexes for provider search performance
-- Run this in your Supabase SQL Editor

-- Index for provider type filtering
CREATE INDEX IF NOT EXISTS idx_entities_provider_type
ON entities(type)
WHERE type = 'provider';

-- Index for state filtering
CREATE INDEX IF NOT EXISTS idx_entities_provider_state
ON entities((content->'address'->>'state'))
WHERE type = 'provider';

-- Index for city filtering
CREATE INDEX IF NOT EXISTS idx_entities_provider_city
ON entities((content->'address'->>'city'))
WHERE type = 'provider';

-- Index for zip code filtering
CREATE INDEX IF NOT EXISTS idx_entities_provider_zip
ON entities((content->'address'->>'zip'))
WHERE type = 'provider';

-- GIN index for specialty filtering (array contains)
CREATE INDEX IF NOT EXISTS idx_entities_provider_specialties
ON entities USING GIN ((content->'specialties'))
WHERE type = 'provider';

-- Index for slug lookups
CREATE INDEX IF NOT EXISTS idx_entities_provider_slug
ON entities(slug)
WHERE type = 'provider';

-- Composite index for common queries
CREATE INDEX IF NOT EXISTS idx_entities_provider_state_type
ON entities(type, (content->'address'->>'state'))
WHERE type = 'provider';
