/**
 * Shared usage data aggregation.
 *
 * Used by both the server page (initial load) and the API route (period changes).
 */

import type { SupabaseClient } from "@supabase/supabase-js";

export interface UsageData {
  credits: {
    monthly_included: number;
    monthly_used: number;
    topup_balance: number;
    remaining: number;
  };
  period_stats: {
    total_credits: number;
    total_messages: number;
    total_input_tokens: number;
    total_output_tokens: number;
  };
  by_day: Array<{ date: string; credits: number; messages: number }>;
  by_agent: Array<{
    agent_id: string;
    agent_name: string;
    model: string;
    credits: number;
    messages: number;
  }>;
  by_model: Array<{ model: string; credits: number; messages: number }>;
}

export async function getUsageData(
  supabase: SupabaseClient,
  userId: string,
  period: string
): Promise<UsageData> {
  const days = period === "7d" ? 7 : period === "90d" ? 90 : 30;
  const since = new Date();
  since.setDate(since.getDate() - days);
  const sinceISO = since.toISOString();

  const [creditsResult, logsResult, agentNamesResult] = await Promise.all([
    supabase
      .from("user_credits")
      .select("monthly_included, monthly_used, topup_balance")
      .eq("user_id", userId)
      .single(),
    supabase
      .from("usage_logs")
      .select(
        "agent_id, model, model_tier, credits_consumed, input_tokens, output_tokens, created_at"
      )
      .eq("user_id", userId)
      .gte("created_at", sinceISO)
      .order("created_at", { ascending: true }),
    supabase.from("ai_agents").select("id, name").eq("user_id", userId),
  ]);

  const credits = creditsResult.data ?? {
    monthly_included: 500,
    monthly_used: 0,
    topup_balance: 0,
  };
  const logs = logsResult.data ?? [];
  const agentMap = new Map(
    (agentNamesResult.data ?? []).map((a) => [a.id, a.name])
  );

  const monthlyRemaining = Math.max(
    0,
    credits.monthly_included - credits.monthly_used
  );
  const remaining = monthlyRemaining + credits.topup_balance;

  let totalCredits = 0;
  let totalInputTokens = 0;
  let totalOutputTokens = 0;
  for (const log of logs) {
    totalCredits += Number(log.credits_consumed) || 0;
    totalInputTokens += log.input_tokens ?? 0;
    totalOutputTokens += log.output_tokens ?? 0;
  }

  // Group by day
  const dayMap = new Map<string, { credits: number; messages: number }>();
  for (const log of logs) {
    const day = log.created_at.slice(0, 10);
    const entry = dayMap.get(day) ?? { credits: 0, messages: 0 };
    entry.credits += Number(log.credits_consumed) || 0;
    entry.messages += 1;
    dayMap.set(day, entry);
  }
  const byDay = Array.from(dayMap.entries())
    .map(([date, stats]) => ({
      date,
      credits: Math.round(stats.credits * 100) / 100,
      messages: stats.messages,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  // Group by agent
  const agentAgg = new Map<
    string,
    { credits: number; messages: number; model: string }
  >();
  for (const log of logs) {
    if (!log.agent_id) continue;
    const entry = agentAgg.get(log.agent_id) ?? {
      credits: 0,
      messages: 0,
      model: log.model,
    };
    entry.credits += Number(log.credits_consumed) || 0;
    entry.messages += 1;
    agentAgg.set(log.agent_id, entry);
  }
  const byAgent = Array.from(agentAgg.entries())
    .map(([agentId, stats]) => ({
      agent_id: agentId,
      agent_name: agentMap.get(agentId) ?? "Deleted Agent",
      model: stats.model,
      credits: Math.round(stats.credits * 100) / 100,
      messages: stats.messages,
    }))
    .sort((a, b) => b.credits - a.credits);

  // Group by model
  const modelAgg = new Map<string, { credits: number; messages: number }>();
  for (const log of logs) {
    const entry = modelAgg.get(log.model) ?? { credits: 0, messages: 0 };
    entry.credits += Number(log.credits_consumed) || 0;
    entry.messages += 1;
    modelAgg.set(log.model, entry);
  }
  const byModel = Array.from(modelAgg.entries())
    .map(([model, stats]) => ({
      model,
      credits: Math.round(stats.credits * 100) / 100,
      messages: stats.messages,
    }))
    .sort((a, b) => b.credits - a.credits);

  return {
    credits: {
      monthly_included: credits.monthly_included,
      monthly_used: Math.round(Number(credits.monthly_used) * 100) / 100,
      topup_balance: Math.round(Number(credits.topup_balance) * 100) / 100,
      remaining: Math.round(remaining * 100) / 100,
    },
    period_stats: {
      total_credits: Math.round(totalCredits * 100) / 100,
      total_messages: logs.length,
      total_input_tokens: totalInputTokens,
      total_output_tokens: totalOutputTokens,
    },
    by_day: byDay,
    by_agent: byAgent,
    by_model: byModel,
  };
}
