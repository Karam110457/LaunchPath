-- Phase 1 Fix 1.1: Concurrency guards for edge function processors
-- Prevents duplicate message sends when concurrent cron invocations overlap.

-- 1. Add claim_token column to template_send_messages
ALTER TABLE template_send_messages
  ADD COLUMN IF NOT EXISTS claim_token UUID,
  ADD COLUMN IF NOT EXISTS claimed_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_tsm_claim_token
  ON template_send_messages(claim_token) WHERE claim_token IS NOT NULL;

-- 2. Atomic claim function for template sends
-- Claims a batch of queued messages by setting claim_token + status='processing'.
-- Returns the number of rows claimed. Concurrent calls get disjoint batches.
CREATE OR REPLACE FUNCTION claim_send_messages(
  p_job_id UUID,
  p_claim_token UUID,
  p_limit INT DEFAULT 50
) RETURNS INT AS $$
DECLARE
  claimed INT;
BEGIN
  WITH batch AS (
    SELECT id FROM template_send_messages
    WHERE job_id = p_job_id
      AND status = 'queued'
    ORDER BY id
    LIMIT p_limit
    FOR UPDATE SKIP LOCKED
  )
  UPDATE template_send_messages m
  SET status = 'processing',
      claim_token = p_claim_token,
      claimed_at = now()
  FROM batch
  WHERE m.id = batch.id;

  GET DIAGNOSTICS claimed = ROW_COUNT;
  RETURN claimed;
END;
$$ LANGUAGE plpgsql;

-- 3. Add claim columns to contact_sequence_state for sequence processor
ALTER TABLE contact_sequence_state
  ADD COLUMN IF NOT EXISTS claim_token UUID,
  ADD COLUMN IF NOT EXISTS claimed_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_css_claim_token
  ON contact_sequence_state(claim_token) WHERE claim_token IS NOT NULL;

-- 4. Atomic claim function for sequence processor
CREATE OR REPLACE FUNCTION claim_sequence_enrollments(
  p_claim_token UUID,
  p_limit INT DEFAULT 50
) RETURNS INT AS $$
DECLARE
  claimed INT;
BEGIN
  WITH batch AS (
    SELECT id FROM contact_sequence_state
    WHERE status = 'active'
      AND next_send_at <= now()
    ORDER BY next_send_at
    LIMIT p_limit
    FOR UPDATE SKIP LOCKED
  )
  UPDATE contact_sequence_state m
  SET claim_token = p_claim_token,
      claimed_at = now()
  FROM batch
  WHERE m.id = batch.id;

  GET DIAGNOSTICS claimed = ROW_COUNT;
  RETURN claimed;
END;
$$ LANGUAGE plpgsql;

-- 5. Atomic counter increment for webhook delivery status updates
-- Avoids read-modify-write race conditions on job counters.
CREATE OR REPLACE FUNCTION increment_job_counter(
  p_job_id UUID,
  p_counter TEXT
) RETURNS VOID AS $$
BEGIN
  EXECUTE format(
    'UPDATE template_send_jobs SET %I = COALESCE(%I, 0) + 1, updated_at = now() WHERE id = $1',
    p_counter, p_counter
  ) USING p_job_id;
END;
$$ LANGUAGE plpgsql;

-- 6. Atomic conversation_count increment for campaign contacts
CREATE OR REPLACE FUNCTION increment_contact_conversation_count(
  p_channel_id UUID,
  p_phone TEXT
) RETURNS VOID AS $$
BEGIN
  UPDATE campaign_contacts
  SET conversation_count = COALESCE(conversation_count, 0) + 1,
      updated_at = now()
  WHERE channel_id = p_channel_id AND phone = p_phone;
END;
$$ LANGUAGE plpgsql;
