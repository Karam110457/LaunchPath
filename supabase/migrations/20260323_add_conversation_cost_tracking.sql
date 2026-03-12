-- Add cost tracking columns to channel_conversations
ALTER TABLE public.channel_conversations
  ADD COLUMN IF NOT EXISTS total_credits NUMERIC(10,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_input_tokens INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_output_tokens INT NOT NULL DEFAULT 0;

-- Atomic increment function for conversation cost
CREATE OR REPLACE FUNCTION increment_conversation_cost(
  p_conversation_id UUID, p_credits NUMERIC, p_input INT, p_output INT
) RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE channel_conversations SET
    total_credits = total_credits + p_credits,
    total_input_tokens = total_input_tokens + p_input,
    total_output_tokens = total_output_tokens + p_output
  WHERE id = p_conversation_id;
END; $$;
