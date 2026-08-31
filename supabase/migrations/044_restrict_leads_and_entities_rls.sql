-- Migration: Restrict leads and entities RLS policies
--
-- SECURITY FIX: Previous policies exposed sensitive data:
--   - leads table: ANY authenticated user could read ALL lead PII
--   - entities table: ANY authenticated user could read ALL entities including drafts
--
-- This migration removes overly permissive client-side read access.
-- Service role (used by API routes) bypasses RLS for legitimate server-side access.

-- =============================================================================
-- FIX 1: Leads Table - Remove authenticated read access
-- =============================================================================
-- The leads table contains PII (email, source_path, referrer, etc.)
-- Only service role should have access for admin dashboard operations

DROP POLICY IF EXISTS "Authenticated users can read leads" ON leads;

-- Update the security documentation
COMMENT ON TABLE leads IS 'General lead capture for various intents (newsletter, product interest, architect saves, etc.). ALL ACCESS: Server-only via service role key. No client-side access (anon or authenticated). Anon users cannot directly access this table.';

-- =============================================================================
-- FIX 2: Entities Table - Remove authenticated read-all access
-- =============================================================================
-- The entities table has a "Public read access" policy for active content,
-- but also had an "Authenticated read all" policy that exposed drafts.
-- Remove the draft-exposing policy while keeping public access to active content.

DROP POLICY IF EXISTS "Authenticated read all" ON entities;

-- Update the security documentation
COMMENT ON TABLE entities IS 'Universal content table (treatments, conditions, resources). READ: Public can read active content only (status=active). WRITE: Service role only (bypasses RLS). Draft/pending content is NOT exposed to any client.';
