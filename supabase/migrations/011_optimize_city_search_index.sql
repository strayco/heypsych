-- Optimize city search for prefix matching
-- This migration adds a text pattern ops index to support efficient ILIKE queries with prefix patterns (city%)
-- Migration 011: Optimize city search with text pattern operations

-- Drop the existing basic city index since we're creating a better one
DROP INDEX IF EXISTS idx_providers_city;
DROP INDEX IF EXISTS idx_entities_provider_city;

-- Create a text pattern ops index for efficient prefix matching CONCURRENTLY
-- This supports ILIKE queries with patterns like 'Los Angeles%' efficiently
-- CONCURRENTLY allows the index to be built without blocking the table
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_entities_provider_city_prefix
  ON entities ((LOWER(content -> 'address' ->> 'city')) text_pattern_ops)
  WHERE type = 'provider';

-- Comment on the index
COMMENT ON INDEX idx_entities_provider_city_prefix IS 'Optimizes provider city searches with prefix matching (e.g., ILIKE ''city%'')';
