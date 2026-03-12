-- Add credit cap columns to clients table
ALTER TABLE public.clients
  ADD COLUMN IF NOT EXISTS credit_cap_monthly NUMERIC(10,2) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS credit_cap_used NUMERIC(10,2) NOT NULL DEFAULT 0;

-- Atomic cap increment with row locking (returns TRUE if within cap, FALSE if exceeded)
CREATE OR REPLACE FUNCTION increment_client_cap_used(
  p_client_id UUID, p_amount NUMERIC
) RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_cap NUMERIC; v_used NUMERIC;
BEGIN
  SELECT credit_cap_monthly, credit_cap_used INTO v_cap, v_used
    FROM clients WHERE id = p_client_id FOR UPDATE;
  IF NOT FOUND OR v_cap IS NULL THEN RETURN TRUE; END IF;
  IF (v_used + p_amount) > v_cap THEN RETURN FALSE; END IF;
  UPDATE clients SET credit_cap_used = credit_cap_used + p_amount WHERE id = p_client_id;
  RETURN TRUE;
END; $$;

-- Monthly reset function (to be called by cron or billing cycle)
CREATE OR REPLACE FUNCTION reset_client_credit_caps()
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE clients SET credit_cap_used = 0 WHERE credit_cap_monthly IS NOT NULL;
END; $$;
