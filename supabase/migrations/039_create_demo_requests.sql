-- Migration: P0-8 Create demo_requests table with secure RLS
--
-- This creates the demo_requests table for clinician tool lead capture
-- with server-only write access (via service role) and authenticated read access

-- Create the table
CREATE TABLE IF NOT EXISTS demo_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  phone TEXT,
  practice_name TEXT,
  practice_size TEXT NOT NULL,
  practice_setting TEXT NOT NULL,
  role TEXT NOT NULL,
  tool_slug TEXT NOT NULL,
  tool_name TEXT NOT NULL,
  message TEXT,
  timeline TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  matcher_source BOOLEAN DEFAULT false,
  agreed_to_terms BOOLEAN NOT NULL DEFAULT false,
  marketing_consent BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL DEFAULT 'new',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index for common queries
CREATE INDEX IF NOT EXISTS idx_demo_requests_tool_slug ON demo_requests(tool_slug);
CREATE INDEX IF NOT EXISTS idx_demo_requests_created_at ON demo_requests(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_demo_requests_status ON demo_requests(status);

-- Enable RLS
ALTER TABLE demo_requests ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies (clean slate)
DROP POLICY IF EXISTS "Allow anonymous inserts" ON demo_requests;
DROP POLICY IF EXISTS "Allow admin reads" ON demo_requests;
DROP POLICY IF EXISTS "Service role full access" ON demo_requests;
DROP POLICY IF EXISTS "Authenticated users can read" ON demo_requests;

-- Policy: Authenticated users can read (for admin dashboard)
-- Service role bypasses RLS by default, so no explicit policy needed for writes
CREATE POLICY "Authenticated users can read" ON demo_requests
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Note: Service role (used by API routes) bypasses RLS entirely
-- Anon users cannot read or write to this table

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_demo_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS demo_requests_updated_at ON demo_requests;
CREATE TRIGGER demo_requests_updated_at
  BEFORE UPDATE ON demo_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_demo_requests_updated_at();

-- Document the security model
COMMENT ON TABLE demo_requests IS 'Lead capture for EHR demo requests. WRITES: Server-only via service role key (API routes). READS: Authenticated users only (admin dashboard). Anon users cannot directly access this table.';
