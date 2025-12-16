-- Migration 20251125: Skipped - index creation times out via CLI
-- Run indexes manually in Supabase Dashboard SQL Editor (no timeout)

-- Recommended indexes (copy/paste into Supabase SQL Editor):
/*
CREATE INDEX IF NOT EXISTS idx_entities_type_status ON entities(type, status);
CREATE INDEX IF NOT EXISTS idx_entities_slug_status ON entities(slug, status);
CREATE INDEX IF NOT EXISTS idx_entities_active ON entities(type, title) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_entities_updated_at ON entities(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_entities_seo_composite ON entities(type, status, updated_at DESC);
*/

SELECT 1; -- no-op
