-- Migration: Create demo_requests table for EHR lead capture
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS demo_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Contact Info
  email TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  phone TEXT,

  -- Practice Info
  practice_name TEXT,
  practice_size TEXT NOT NULL,
  practice_setting TEXT NOT NULL,
  role TEXT NOT NULL,

  -- Intent
  tool_slug TEXT NOT NULL,
  tool_name TEXT NOT NULL,
  message TEXT,
  timeline TEXT,

  -- Attribution
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  matcher_source BOOLEAN DEFAULT FALSE,

  -- Consent
  agreed_to_terms BOOLEAN NOT NULL DEFAULT FALSE,
  marketing_consent BOOLEAN DEFAULT FALSE,

  -- Status
  status TEXT NOT NULL DEFAULT 'new',

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for querying by tool and status
CREATE INDEX idx_demo_requests_tool_slug ON demo_requests(tool_slug);
CREATE INDEX idx_demo_requests_status ON demo_requests(status);
CREATE INDEX idx_demo_requests_created_at ON demo_requests(created_at DESC);

-- Unique constraint to prevent duplicate submissions for same email+tool
CREATE UNIQUE INDEX idx_demo_requests_email_tool ON demo_requests(email, tool_slug);

-- Enable RLS
ALTER TABLE demo_requests ENABLE ROW LEVEL SECURITY;

-- Policy: Anon users can insert (for form submissions)
CREATE POLICY "Allow anonymous inserts" ON demo_requests
  FOR INSERT
  WITH CHECK (true);

-- Policy: Only authenticated admins can read
CREATE POLICY "Allow admin reads" ON demo_requests
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_demo_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_demo_requests_updated_at
  BEFORE UPDATE ON demo_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_demo_requests_updated_at();

-- Comments for documentation
COMMENT ON TABLE demo_requests IS 'Lead capture for EHR demo requests from clinician tools';
COMMENT ON COLUMN demo_requests.practice_size IS 'solo, small-2-10, medium-11-50, large-51-200, enterprise-200-plus';
COMMENT ON COLUMN demo_requests.status IS 'new, contacted, qualified, converted, closed';
COMMENT ON COLUMN demo_requests.matcher_source IS 'True if lead came from EHR matcher questionnaire';
