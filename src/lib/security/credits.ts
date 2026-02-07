/**
 * Credit system security for LaunchPath.
 *
 * From the PRD: credits are tied to high-value generations (Offer/Build/Sell tools,
 * Validate, Competitor, Pivot, Sales Prep). Free trial gives a limited allocation;
 * paid users get monthly refill.
 *
 * Security requirements:
 * 1. Credits MUST be checked and decremented server-side ONLY (never trust client).
 * 2. Credit balance lives in Supabase with RLS; only the user can read, only the
 *    server (via RLS policy on authenticated user) can decrement.
 * 3. Race conditions: use Supabase's `rpc` for atomic decrement (not read-then-write).
 * 4. Feature gating: trial users cannot access "finish line" features even if they
 *    somehow have credits.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { GenerationType } from "./ai-safety";

/**
 * Credit cost per generation type.
 * Adjust so free trial users can experience real value but not complete everything.
 */
export const CREDIT_COSTS: Record<GenerationType, number> = {
  offer_blueprint: 5,
  build_plan: 5,
  sales_plan: 5,
  validate_idea: 3,
  competitor_analysis: 4,
  pivot_offer: 3,
  sales_call_prep: 3,
  chat_followup: 1,
  direction_engine: 4,
};

/**
 * Features gated behind paid plan (not just credits).
 * Even if a trial user has credits, these require an active subscription.
 */
export const PAID_ONLY_FEATURES: Set<GenerationType> = new Set([
  "competitor_analysis",
  "sales_call_prep",
]);

export type CreditCheckResult =
  | { allowed: true; cost: number; remaining: number }
  | { allowed: false; reason: "insufficient_credits" | "paid_only" | "error"; message: string };

/**
 * Check if user has enough credits for a generation. Does NOT decrement.
 * Use before starting an expensive AI call.
 *
 * @param supabase - Authenticated Supabase client (user context via RLS).
 * @param userId - auth.uid()
 * @param generationType - which tool/generation is requested
 * @param isPaidUser - whether user has an active subscription
 */
export async function checkCredits(
  supabase: SupabaseClient,
  userId: string,
  generationType: GenerationType,
  isPaidUser: boolean
): Promise<CreditCheckResult> {
  // Feature gate check
  if (PAID_ONLY_FEATURES.has(generationType) && !isPaidUser) {
    return {
      allowed: false,
      reason: "paid_only",
      message: "This feature requires an active subscription.",
    };
  }

  const cost = CREDIT_COSTS[generationType];

  // Read current balance (RLS ensures user can only see own row)
  const { data, error } = await supabase
    .from("user_credits")
    .select("balance")
    .eq("user_id", userId)
    .single();

  if (error || !data) {
    return {
      allowed: false,
      reason: "error",
      message: "Unable to check credit balance.",
    };
  }

  if (data.balance < cost) {
    return {
      allowed: false,
      reason: "insufficient_credits",
      message: `This action costs ${cost} credits. You have ${data.balance}.`,
    };
  }

  return { allowed: true, cost, remaining: data.balance - cost };
}

/**
 * Atomically decrement credits. Call AFTER the AI generation succeeds.
 * Uses a Supabase RPC function for atomic update (no read-then-write race).
 *
 * You must create this function in Supabase:
 *
 * ```sql
 * CREATE OR REPLACE FUNCTION decrement_credits(p_user_id uuid, p_amount int)
 * RETURNS int AS $$
 * DECLARE new_balance int;
 * BEGIN
 *   UPDATE user_credits
 *     SET balance = balance - p_amount,
 *         updated_at = now()
 *     WHERE user_id = p_user_id AND balance >= p_amount
 *     RETURNING balance INTO new_balance;
 *   IF NOT FOUND THEN
 *     RAISE EXCEPTION 'Insufficient credits';
 *   END IF;
 *   RETURN new_balance;
 * END;
 * $$ LANGUAGE plpgsql SECURITY DEFINER;
 * ```
 */
export async function decrementCredits(
  supabase: SupabaseClient,
  userId: string,
  generationType: GenerationType
): Promise<{ success: true; newBalance: number } | { success: false; message: string }> {
  const cost = CREDIT_COSTS[generationType];

  const { data, error } = await supabase.rpc("decrement_credits", {
    p_user_id: userId,
    p_amount: cost,
  });

  if (error) {
    return { success: false, message: "Failed to decrement credits." };
  }

  return { success: true, newBalance: data as number };
}
