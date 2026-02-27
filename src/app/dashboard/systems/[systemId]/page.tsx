import { requireAuth } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { getTargetCurrencySymbol } from "@/lib/utils/currency";
import { SystemWorkspace } from "@/components/dashboard/SystemWorkspace";

interface Offer {
  segment?: string;
  system_description?: string;
  transformation_from?: string;
  transformation_to?: string;
  pitch_from?: string;
  pitch_to?: string;
  guarantee_text?: string;
  guarantee_type?: "time_bound" | "outcome_based" | "risk_reversal";
  guarantee_confidence?: string;
  pricing_setup?: number;
  pricing_monthly?: number;
  pricing_rationale?: string;
  pricing_comparables?: Array<{ service: string; price_range: string }>;
  revenue_projection?: { clients_needed: number; monthly_revenue: string };
  delivery_model?: string;
}

interface Recommendation {
  niche?: string;
  score?: number;
  bottleneck?: string;
  your_solution?: string;
  target_segment?: { description?: string };
  strategic_insight?: string;
}

interface Submission {
  result: { priority?: string } | null;
  created_at: string;
}

export default async function SystemDetailPage({
  params,
}: {
  params: Promise<{ systemId: string }>;
}) {
  const { systemId } = await params;
  const user = await requireAuth();
  const supabase = await createClient();

  const [{ data: system }, { data: submissions }, { data: userProfile }] =
    await Promise.all([
      supabase
        .from("user_systems")
        .select("*")
        .eq("id", systemId)
        .eq("user_id", user.id)
        .single(),
      supabase
        .from("demo_submissions")
        .select("result, created_at")
        .eq("system_id", systemId)
        .order("created_at", { ascending: false })
        .limit(50),
      supabase
        .from("user_profiles")
        .select("location_country")
        .eq("id", user.id)
        .single(),
    ]);

  if (!system) notFound();

  const offer = system.offer as Offer | null;
  const recommendation = system.chosen_recommendation as Recommendation | null;
  const currency = getTargetCurrencySymbol(
    userProfile?.location_country ?? null,
    system.location_target,
  );
  const isComplete = system.status === "complete";

  const scoreDist = { HIGH: 0, MEDIUM: 0, LOW: 0 };
  (submissions ?? []).forEach((s: Submission) => {
    const priority = (s.result as { priority?: string } | null)?.priority;
    if (priority && priority in scoreDist) {
      scoreDist[priority as keyof typeof scoreDist]++;
    }
  });
  const totalLeads = (submissions ?? []).length;

  const systemName =
    offer?.system_description ??
    recommendation?.niche ??
    "New Business";
  const segment = offer?.segment ?? "";

  return (
    <SystemWorkspace
      systemId={systemId}
      systemName={systemName}
      segment={segment}
      isComplete={isComplete}
      currentStep={system.current_step ?? 1}
      offer={offer}
      recommendation={recommendation}
      demoUrl={system.demo_url}
      submissions={(submissions ?? []) as Submission[]}
      totalLeads={totalLeads}
      scoreDist={scoreDist}
      currency={currency}
    />
  );
}
