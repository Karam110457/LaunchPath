-- =============================================================================
-- LaunchPath — RLS Policies for Production
-- Run in Supabase SQL Editor after creating the tables.
--
-- Tables derived from PRD:
--   user_profiles   — onboarding data (goal, time/week, skill level, etc.)
--   blueprints      — Offer Blueprints (primary saved object, versioned)
--   blueprint_versions — version history for blueprints
--   user_credits    — credit balance and usage tracking
--   credit_ledger   — immutable audit trail of credit transactions
--   chat_messages   — follow-up chat messages tied to a blueprint
--   generations     — AI generation log (audit + cost tracking)
-- =============================================================================


-- ============================================================
-- 1. USER PROFILES
-- One row per user. Only the owner can read/write their profile.
-- ============================================================

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile"
  ON public.user_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
  ON public.user_profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile"
  ON public.user_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- No DELETE policy: profiles are never deleted by the user (use soft delete or admin).


-- ============================================================
-- 2. BLUEPRINTS
-- Each blueprint belongs to a user. Only the owner can CRUD.
-- ============================================================

ALTER TABLE public.blueprints ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own blueprints"
  ON public.blueprints FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own blueprints"
  ON public.blueprints FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own blueprints"
  ON public.blueprints FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own blueprints"
  ON public.blueprints FOR DELETE
  USING (auth.uid() = user_id);


-- ============================================================
-- 3. BLUEPRINT VERSIONS
-- Linked to blueprints via blueprint_id. Access scoped through parent ownership.
-- ============================================================

ALTER TABLE public.blueprint_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own blueprint versions"
  ON public.blueprint_versions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.blueprints b
      WHERE b.id = blueprint_versions.blueprint_id
        AND b.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert versions for own blueprints"
  ON public.blueprint_versions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.blueprints b
      WHERE b.id = blueprint_versions.blueprint_id
        AND b.user_id = auth.uid()
    )
  );

-- No UPDATE/DELETE: versions are immutable (append-only history).


-- ============================================================
-- 4. USER CREDITS
-- One row per user. Only the owner can read. Writes happen via
-- server-side RPC (decrement_credits) which is SECURITY DEFINER.
-- ============================================================

ALTER TABLE public.user_credits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own credits"
  ON public.user_credits FOR SELECT
  USING (auth.uid() = user_id);

-- INSERT: only on signup (via trigger or server action)
CREATE POLICY "Users can insert own credit row"
  ON public.user_credits FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- UPDATE: ONLY via the decrement_credits RPC (SECURITY DEFINER).
-- No direct UPDATE policy for authenticated users.
-- This prevents client-side credit manipulation.


-- ============================================================
-- 5. CREDIT LEDGER (immutable audit trail)
-- Records every credit change (purchase, spend, refill, adjustment).
-- Users can read own entries. Inserts are server-side only.
-- ============================================================

ALTER TABLE public.credit_ledger ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own ledger"
  ON public.credit_ledger FOR SELECT
  USING (auth.uid() = user_id);

-- No INSERT/UPDATE/DELETE for authenticated role.
-- Ledger entries are created by SECURITY DEFINER functions only.


-- ============================================================
-- 6. CHAT MESSAGES
-- Each message belongs to a user and optionally a blueprint.
-- Only the owner can CRUD.
-- ============================================================

ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own messages"
  ON public.chat_messages FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own messages"
  ON public.chat_messages FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own messages"
  ON public.chat_messages FOR DELETE
  USING (auth.uid() = user_id);

-- No UPDATE: messages are immutable after creation.


-- ============================================================
-- 7. GENERATIONS (AI generation audit log)
-- Tracks every AI generation: type, tokens, cost, user, blueprint.
-- Users can read own. Inserts are server-side.
-- ============================================================

ALTER TABLE public.generations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own generations"
  ON public.generations FOR SELECT
  USING (auth.uid() = user_id);

-- No INSERT/UPDATE/DELETE for authenticated role.
-- Generations are logged by server-side API routes only.


-- ============================================================
-- 8. ATOMIC CREDIT DECREMENT (RPC)
-- Prevents race conditions and client-side tampering.
-- SECURITY DEFINER runs as the function owner (postgres), bypassing RLS.
-- ============================================================

CREATE OR REPLACE FUNCTION decrement_credits(p_user_id uuid, p_amount int)
RETURNS int AS $$
DECLARE new_balance int;
BEGIN
  UPDATE public.user_credits
    SET balance = balance - p_amount,
        updated_at = now()
    WHERE user_id = p_user_id AND balance >= p_amount
    RETURNING balance INTO new_balance;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Insufficient credits';
  END IF;

  -- Log to ledger
  INSERT INTO public.credit_ledger (user_id, amount, type, description)
  VALUES (p_user_id, -p_amount, 'spend', 'AI generation');

  RETURN new_balance;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Only allow authenticated users to call this function
REVOKE ALL ON FUNCTION decrement_credits FROM public;
GRANT EXECUTE ON FUNCTION decrement_credits TO authenticated;


-- ============================================================
-- 9. CREDIT REFILL (monthly, called by cron or Edge Function)
-- ============================================================

CREATE OR REPLACE FUNCTION refill_credits(p_user_id uuid, p_amount int)
RETURNS int AS $$
DECLARE new_balance int;
BEGIN
  UPDATE public.user_credits
    SET balance = balance + p_amount,
        updated_at = now()
    WHERE user_id = p_user_id
    RETURNING balance INTO new_balance;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'User credits row not found';
  END IF;

  INSERT INTO public.credit_ledger (user_id, amount, type, description)
  VALUES (p_user_id, p_amount, 'refill', 'Monthly credit refill');

  RETURN new_balance;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

REVOKE ALL ON FUNCTION refill_credits FROM public;
-- Only callable from service role (cron/Edge Function), not from client
GRANT EXECUTE ON FUNCTION refill_credits TO service_role;
