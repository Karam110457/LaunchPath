-- Enable pg_cron and pg_net extensions (Supabase Pro)
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Grant usage to postgres role (required for scheduling)
GRANT USAGE ON SCHEMA cron TO postgres;

-- ============================================================================
-- 1. Auto-close stale WIDGET conversations (not WhatsApp)
-- ============================================================================

CREATE OR REPLACE FUNCTION auto_close_stale_widget_conversations()
RETURNS INT LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  closed_count INT := 0;
BEGIN
  -- Close active/paused widget conversations inactive for 24+ hours.
  -- Only targets widget channels — WhatsApp conversations stay open
  -- because session management is handled by Meta's 24h window.
  WITH stale AS (
    SELECT cc.id
    FROM channel_conversations cc
    JOIN agent_channels ac ON ac.id = cc.channel_id
    WHERE ac.channel_type = 'widget'
      AND ac.is_enabled = TRUE
      AND cc.status IN ('active', 'paused')
      AND cc.updated_at < NOW() - INTERVAL '24 hours'
    LIMIT 500
  )
  UPDATE channel_conversations
  SET status = 'closed', updated_at = NOW()
  FROM stale
  WHERE channel_conversations.id = stale.id;

  GET DIAGNOSTICS closed_count = ROW_COUNT;
  RETURN closed_count;
END; $$;

-- Schedule: run every hour at minute 0
SELECT cron.schedule(
  'auto-close-stale-widget-conversations',
  '0 * * * *',
  $$SELECT auto_close_stale_widget_conversations()$$
);

-- ============================================================================
-- 2. Monthly credit cap reset (1st of each month at midnight UTC)
-- ============================================================================

SELECT cron.schedule(
  'reset-client-credit-caps',
  '0 0 1 * *',
  $$SELECT reset_client_credit_caps()$$
);
