-- Add indexes to improve provider search performance
-- This will make ILIKE searches on full_name much faster

-- 1. Create a functional index on full_name extracted from JSONB
-- This allows fast ILIKE queries on content->>'full_name'
CREATE INDEX IF NOT EXISTS idx_entities_provider_full_name
ON entities ((content->>'full_name'))
WHERE type = 'provider';

-- 2. Create a text search index for full-text search (optional, for future)
-- CREATE INDEX IF NOT EXISTS idx_entities_provider_full_name_trgm
-- ON entities USING gin ((content->>'full_name') gin_trgm_ops)
-- WHERE type = 'provider';
-- Note: Requires pg_trgm extension

-- 3. Create index on state for location filtering
CREATE INDEX IF NOT EXISTS idx_entities_provider_state
ON entities ((content->'address'->>'state'))
WHERE type = 'provider';

-- 4. Create index on city for location filtering
CREATE INDEX IF NOT EXISTS idx_entities_provider_city
ON entities ((content->'address'->>'city'))
WHERE type = 'provider';

-- Analyze the table to update statistics
ANALYZE entities;
