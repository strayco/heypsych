-- Migration: Create leads table for general lead capture
--
-- This creates the leads table for various lead capture intents
-- (newsletter, product interest, architect saves, etc.)
-- with server-only write access (via service role) and authenticated read access

-- Create the table
CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  intent TEXT NOT NULL,
  product_slugs TEXT[],
  category_slug TEXT,
  switching_from TEXT,
  source_path TEXT,
  referrer TEXT,
  score INTEGER NOT NULL,
  tier TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_leads_email ON leads(email);
CREATE INDEX IF NOT EXISTS idx_leads_intent ON leads(intent);
CREATE INDEX IF NOT EXISTS idx_leads_tier ON leads(tier);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at DESC);

-- Enable RLS
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- Policy: Authenticated users can read (for admin dashboard)
-- Service role bypasses RLS by default, so no explicit policy needed for writes
CREATE POLICY "Authenticated users can read leads" ON leads
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Note: Service role (used by API routes) bypasses RLS entirely
-- Anon users cannot read or write to this table

-- Document the security model
COMMENT ON TABLE leads IS 'General lead capture for various intents (newsletter, product interest, architect saves, etc.). WRITES: Server-only via service role key (API routes). READS: Authenticated users only (admin dashboard). Anon users cannot directly access this table.';
