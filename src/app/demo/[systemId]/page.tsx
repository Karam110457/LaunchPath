import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { findAgentSlug, getAgentForNiche, buildFallbackAgent } from "@/lib/ai/agents/registry";
import { DemoPage } from "./DemoPage";
import type { DemoConfig } from "@/lib/ai/schemas";

interface DemoPageProps {
  params: Promise<{ systemId: string }>;
}

export default async function DemoPageRoute({ params }: DemoPageProps) {
  const { systemId } = await params;
  const supabase = await createClient();

  const { data: system } = await supabase
    .from("user_systems")
    .select("id, status, chosen_recommendation, offer, demo_url, demo_config")
    .eq("id", systemId)
    .eq("status", "complete")
    .single();

  if (!system) {
    notFound();
  }

  const chosenRec = system.chosen_recommendation as {
    niche: string;
    your_solution: string;
    target_segment: { description: string };
  } | null;

  if (!chosenRec) {
    notFound();
  }

  const offer = system.offer as {
    segment?: string;
    system_description?: string;
    transformation_from?: string;
    transformation_to?: string;
    guarantee_text?: string;
    pricing_setup?: number;
    pricing_monthly?: number;
  } | null;

  // Use AI-generated demo_config if available; fall back to registry agent
  const demoConfig = system.demo_config as DemoConfig | null;

  if (demoConfig) {
    return (
      <DemoPage
        systemId={system.id}
        demoConfig={demoConfig}
        businessName={chosenRec.niche}
        solution={chosenRec.your_solution}
        segment={offer?.segment ?? chosenRec.target_segment.description}
        systemDescription={offer?.system_description}
      />
    );
  }

  // Fallback to registry agent
  const agentSlug = findAgentSlug(chosenRec.niche);
  const agent = agentSlug
    ? getAgentForNiche(agentSlug)
    : buildFallbackAgent(chosenRec.niche, chosenRec.your_solution);

  if (!agent) {
    notFound();
  }

  return (
    <DemoPage
      systemId={system.id}
      agent={agent}
      businessName={chosenRec.niche}
      solution={chosenRec.your_solution}
      segment={offer?.segment ?? chosenRec.target_segment.description}
      systemDescription={offer?.system_description}
    />
  );
}
