-- Migration: P1-1 Restrict demo_requests reads to service role only
--
-- SECURITY FIX: The previous policy allowed ANY authenticated user to read leads.
-- This migration removes client-side read access entirely.
-- Only service role (server-side admin dashboard) can read demo_requests.

-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Authenticated users can read" ON demo_requests;

-- No client-side read policy needed - service role bypasses RLS entirely
-- This means:
--   - Anon clients: NO access (blocked by RLS, no matching policy)
--   - Authenticated clients: NO access (blocked by RLS, no matching policy)
--   - Service role: FULL access (bypasses RLS)

-- Add unique constraint to prevent duplicate submissions (P1-3)
-- A user can only submit one demo request per tool
ALTER TABLE demo_requests DROP CONSTRAINT IF EXISTS demo_requests_email_tool_unique;
ALTER TABLE demo_requests ADD CONSTRAINT demo_requests_email_tool_unique
  UNIQUE (email, tool_slug);

-- Update the security documentation
COMMENT ON TABLE demo_requests IS 'Lead capture for EHR demo requests. ALL ACCESS: Server-only via service role key. No client-side access (anon or authenticated). Unique constraint prevents duplicate email+tool submissions.';
