/**
 * Per-client usage data aggregation for agency analytics.
 *
 * Queries `usage_logs` filtered by `client_id` to provide per-client
 * credit/token breakdowns and an all-clients comparison summary.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

// ── Types ──

export interface ClientUsageData {
  period_stats: {
    total_credits: number;
    total_messages: number;
    total_input_tokens: number;
    total_output_tokens: number;
    avg_credits_per_request: number;
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

export interface ClientUsageSummary {
  client_id: string;
  client_name: string;
  total_credits: number;
  total_messages: number;
  total_tokens: number;
  last_active: string | null;
  credit_cap_monthly: number | null;
  credit_cap_used: number;
}

// ── Helpers ──

function periodToDays(period: string): number {
  return period === "7d" ? 7 : period === "90d" ? 90 : 30;
}

function sinceDate(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString();
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

// ── Per-Client Usage ──

export async function getClientUsageData(
  supabase: SupabaseClient,
  userId: string,
  clientId: string,
  period: string
): Promise<ClientUsageData> {
  const sinceISO = sinceDate(periodToDays(period));

  const [logsResult, agentNamesResult] = await Promise.all([
    supabase
      .from("usage_logs")
      .select(
        "agent_id, model, credits_consumed, input_tokens, output_tokens, created_at"
      )
      .eq("user_id", userId)
      .eq("client_id", clientId)
      .gte("created_at", sinceISO)
      .order("created_at", { ascending: true }),
    supabase.from("ai_agents").select("id, name").eq("user_id", userId),
  ]);

  const logs = logsResult.data ?? [];
  const agentMap = new Map(
    (agentNamesResult.data ?? []).map((a: { id: string; name: string }) => [a.id, a.name])
  );

  // Totals
  let totalCredits = 0;
  let totalInputTokens = 0;
  let totalOutputTokens = 0;
  for (const log of logs) {
    totalCredits += Number(log.credits_consumed) || 0;
    totalInputTokens += log.input_tokens ?? 0;
    totalOutputTokens += log.output_tokens ?? 0;
  }

  const avgCreditsPerRequest =
    logs.length > 0
      ? Math.round((totalCredits / logs.length) * 10000) / 10000
      : 0;

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
    .map(([date, s]) => ({ date, credits: round2(s.credits), messages: s.messages }))
    .sort((a, b) => a.date.localeCompare(b.date));

  // Group by agent
  const agentAgg = new Map<string, { credits: number; messages: number; model: string }>();
  for (const log of logs) {
    if (!log.agent_id) continue;
    const entry = agentAgg.get(log.agent_id) ?? { credits: 0, messages: 0, model: log.model };
    entry.credits += Number(log.credits_consumed) || 0;
    entry.messages += 1;
    agentAgg.set(log.agent_id, entry);
  }
  const byAgent = Array.from(agentAgg.entries())
    .map(([agentId, s]) => ({
      agent_id: agentId,
      agent_name: agentMap.get(agentId) ?? "Deleted Agent",
      model: s.model,
      credits: round2(s.credits),
      messages: s.messages,
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
    .map(([model, s]) => ({ model, credits: round2(s.credits), messages: s.messages }))
    .sort((a, b) => b.credits - a.credits);

  return {
    period_stats: {
      total_credits: round2(totalCredits),
      total_messages: logs.length,
      total_input_tokens: totalInputTokens,
      total_output_tokens: totalOutputTokens,
      avg_credits_per_request: avgCreditsPerRequest,
    },
    by_day: byDay,
    by_agent: byAgent,
    by_model: byModel,
  };
}

// ── All-Clients Summary ──

export async function getAllClientsUsageSummary(
  supabase: SupabaseClient,
  userId: string,
  period: string
): Promise<ClientUsageSummary[]> {
  const sinceISO = sinceDate(periodToDays(period));

  const [clientsResult, logsResult] = await Promise.all([
    supabase
      .from("clients")
      .select("id, name, credit_cap_monthly, credit_cap_used")
      .eq("user_id", userId)
      .eq("status", "active"),
    supabase
      .from("usage_logs")
      .select("client_id, credits_consumed, input_tokens, output_tokens, created_at")
      .eq("user_id", userId)
      .not("client_id", "is", null)
      .gte("created_at", sinceISO)
      .order("created_at", { ascending: false }),
  ]);

  const clients = clientsResult.data ?? [];
  const logs = logsResult.data ?? [];

  // Aggregate per client
  const agg = new Map<
    string,
    { credits: number; messages: number; tokens: number; lastActive: string | null }
  >();
  for (const log of logs) {
    if (!log.client_id) continue;
    const entry = agg.get(log.client_id) ?? {
      credits: 0,
      messages: 0,
      tokens: 0,
      lastActive: null,
    };
    entry.credits += Number(log.credits_consumed) || 0;
    entry.messages += 1;
    entry.tokens += (log.input_tokens ?? 0) + (log.output_tokens ?? 0);
    if (!entry.lastActive) entry.lastActive = log.created_at;
    agg.set(log.client_id, entry);
  }

  // Build summary for every active client (even those with 0 usage)
  return clients
    .map((c) => {
      const stats = agg.get(c.id);
      return {
        client_id: c.id,
        client_name: c.name,
        total_credits: round2(stats?.credits ?? 0),
        total_messages: stats?.messages ?? 0,
        total_tokens: stats?.tokens ?? 0,
        last_active: stats?.lastActive ?? null,
        credit_cap_monthly: c.credit_cap_monthly ?? null,
        credit_cap_used: Number(c.credit_cap_used) || 0,
      };
    })
    .sort((a, b) => b.total_credits - a.total_credits);
}
