-- Migration: Add RLS policies to entities table
--
-- The entities table stores public content (treatments, conditions, resources).
-- READ: Public (anonymous and authenticated users)
-- WRITE: Service role only (content management via API/scripts)

-- Enable RLS
ALTER TABLE entities ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies (clean slate)
DROP POLICY IF EXISTS "Public read access" ON entities;
DROP POLICY IF EXISTS "Service role write access" ON entities;
DROP POLICY IF EXISTS "Authenticated read access" ON entities;

-- Policy: Anyone can read active entities
-- This allows the public site to display content without authentication
CREATE POLICY "Public read access" ON entities
  FOR SELECT
  USING (status = 'active');

-- Policy: Authenticated users can read all entities (including drafts, for admin)
CREATE POLICY "Authenticated read all" ON entities
  FOR SELECT
  TO authenticated
  USING (true);

-- Note: Service role (used by content sync scripts) bypasses RLS entirely
-- for writes. Anon users cannot write to this table.

-- Document the security model
COMMENT ON TABLE entities IS 'Universal content table (treatments, conditions, resources). READ: Public can read active content; authenticated can read all. WRITE: Service role only (bypasses RLS).';
