-- DB-backed rate limiter table for cross-instance enforcement.
-- Used by machine-to-machine APIs (ingest, webhooks) where
-- in-memory rate limiting doesn't work across serverless instances.

CREATE TABLE IF NOT EXISTS rate_limit_entries (
  key TEXT PRIMARY KEY,
  count INT NOT NULL DEFAULT 1,
  window_start TIMESTAMPTZ NOT NULL DEFAULT now(),
  window_end TIMESTAMPTZ NOT NULL
);

-- Auto-cleanup old entries every hour via pg_cron (if available)
CREATE INDEX IF NOT EXISTS idx_rate_limit_window_end
  ON rate_limit_entries(window_end);

-- Atomic rate limit check + increment
CREATE OR REPLACE FUNCTION check_rate_limit(
  p_key TEXT,
  p_max_requests INT,
  p_window_seconds INT DEFAULT 60
) RETURNS JSON AS $$
DECLARE
  v_entry rate_limit_entries%ROWTYPE;
  v_now TIMESTAMPTZ := now();
  v_window_end TIMESTAMPTZ;
BEGIN
  v_window_end := v_now + (p_window_seconds || ' seconds')::interval;

  -- Try to insert or update atomically
  INSERT INTO rate_limit_entries (key, count, window_start, window_end)
  VALUES (p_key, 1, v_now, v_window_end)
  ON CONFLICT (key) DO UPDATE
  SET
    count = CASE
      WHEN rate_limit_entries.window_end < v_now THEN 1  -- Window expired, reset
      ELSE rate_limit_entries.count + 1
    END,
    window_start = CASE
      WHEN rate_limit_entries.window_end < v_now THEN v_now
      ELSE rate_limit_entries.window_start
    END,
    window_end = CASE
      WHEN rate_limit_entries.window_end < v_now THEN v_window_end
      ELSE rate_limit_entries.window_end
    END
  RETURNING * INTO v_entry;

  RETURN json_build_object(
    'allowed', v_entry.count <= p_max_requests,
    'current_count', v_entry.count,
    'reset_at', v_entry.window_end
  );
END;
$$ LANGUAGE plpgsql;

-- Cleanup function to purge expired entries
CREATE OR REPLACE FUNCTION cleanup_rate_limits() RETURNS VOID AS $$
BEGIN
  DELETE FROM rate_limit_entries WHERE window_end < now();
END;
$$ LANGUAGE plpgsql;
