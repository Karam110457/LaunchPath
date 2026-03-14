-- Wrapper function to invoke sequence-processor edge function via pg_net
CREATE OR REPLACE FUNCTION invoke_sequence_processor()
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_url TEXT;
  v_secret TEXT;
BEGIN
  SELECT decrypted_secret INTO v_url
    FROM vault.decrypted_secrets WHERE name = 'supabase_url';
  SELECT decrypted_secret INTO v_secret
    FROM vault.decrypted_secrets WHERE name = 'cron_secret';

  IF v_url IS NULL OR v_secret IS NULL THEN
    RAISE LOG 'sequence-processor: missing vault secrets';
    RETURN;
  END IF;

  PERFORM net.http_post(
    url := v_url || '/functions/v1/sequence-processor',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || v_secret
    ),
    body := '{}'::jsonb
  );
END; $$;

-- Schedule: every minute
SELECT cron.schedule(
  'process-sequences',
  '* * * * *',
  $$SELECT invoke_sequence_processor()$$
);
