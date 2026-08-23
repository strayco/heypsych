-- Migration: Add notification tracking to demo_requests
--
-- Tracks whether notifications were sent successfully for:
-- - Operator notification (internal team alert)
-- - Buyer confirmation (acknowledgment to the person who submitted)

-- Add notification status columns
ALTER TABLE demo_requests
ADD COLUMN IF NOT EXISTS notification_status_operator TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS notification_status_buyer TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS notification_sent_at TIMESTAMPTZ;

-- Add index for notification retries
CREATE INDEX IF NOT EXISTS idx_demo_requests_notification_pending
ON demo_requests(notification_status_operator, notification_status_buyer)
WHERE notification_status_operator = 'pending' OR notification_status_buyer = 'pending';

-- Document the columns
COMMENT ON COLUMN demo_requests.notification_status_operator IS 'Operator notification status: pending, sent, failed';
COMMENT ON COLUMN demo_requests.notification_status_buyer IS 'Buyer confirmation email status: pending, sent, failed';
COMMENT ON COLUMN demo_requests.notification_sent_at IS 'Timestamp when notifications were last attempted';
