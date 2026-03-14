-- Schedule template-sends edge function via pg_cron + pg_net
-- pg_net makes an HTTP POST to the edge function every minute.
-- The edge function handles Meta WhatsApp API calls (can't do that in SQL).
--
-- IMPORTANT: After deploying the edge function, set these secrets:
--   supabase secrets set CRON_SECRET=<your-cron-secret>
--
-- The SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are auto-injected by Supabase.

-- Use pg_net to call the edge function from pg_cron.
-- The edge function URL follows the pattern:
--   {SUPABASE_URL}/functions/v1/template-sends
--
-- We use current_setting('app.settings.supabase_url') which is set by Supabase,
-- but since pg_cron runs as postgres and may not have that, we use a wrapper function.

CREATE OR REPLACE FUNCTION invoke_template_sends_edge_function()
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  edge_url TEXT;
  service_key TEXT;
  cron_secret TEXT;
BEGIN
  -- Read from vault or env. On Supabase, these are available via:
  edge_url := current_setting('supabase.url', true);
  service_key := current_setting('supabase.service_role_key', true);

  -- Fallback: read from a config table if settings not available
  IF edge_url IS NULL THEN
    SELECT decrypted_secret INTO edge_url
    FROM vault.decrypted_secrets
    WHERE name = 'supabase_url'
    LIMIT 1;
  END IF;

  IF service_key IS NULL THEN
    SELECT decrypted_secret INTO service_key
    FROM vault.decrypted_secrets
    WHERE name = 'supabase_service_role_key'
    LIMIT 1;
  END IF;

  -- Read CRON_SECRET from vault
  SELECT decrypted_secret INTO cron_secret
  FROM vault.decrypted_secrets
  WHERE name = 'cron_secret'
  LIMIT 1;

  -- Only proceed if we have the required values
  IF edge_url IS NOT NULL AND service_key IS NOT NULL THEN
    PERFORM net.http_post(
      url := edge_url || '/functions/v1/template-sends',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || COALESCE(cron_secret, service_key)
      ),
      body := '{}'::jsonb
    );
  END IF;
END; $$;

-- Schedule: run every minute
SELECT cron.schedule(
  'process-template-sends',
  '* * * * *',
  $$SELECT invoke_template_sends_edge_function()$$
);
