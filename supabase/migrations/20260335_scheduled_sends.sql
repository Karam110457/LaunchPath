-- Add scheduled_for column to template_send_jobs for deferred sends
ALTER TABLE template_send_jobs ADD COLUMN IF NOT EXISTS scheduled_for TIMESTAMPTZ;

-- Add retry columns to template_send_messages for auto-retry (6.5)
ALTER TABLE template_send_messages ADD COLUMN IF NOT EXISTS retry_count INT DEFAULT 0;
ALTER TABLE template_send_messages ADD COLUMN IF NOT EXISTS last_error TEXT;
ALTER TABLE template_send_messages ADD COLUMN IF NOT EXISTS next_retry_at TIMESTAMPTZ;

-- Index for scheduled jobs query
CREATE INDEX IF NOT EXISTS idx_tsj_scheduled
ON template_send_jobs(scheduled_for) WHERE status = 'pending' AND scheduled_for IS NOT NULL;
