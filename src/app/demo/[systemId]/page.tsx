import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAgentForNiche, findAgentSlug } from "@/lib/ai/agents/registry";
import { DemoPage } from "./DemoPage";

interface DemoPageProps {
  params: Promise<{ systemId: string }>;
}

export default async function DemoPageRoute({ params }: DemoPageProps) {
  const { systemId } = await params;
  const supabase = await createClient();

  const { data: system } = await supabase
    .from("user_systems")
    .select("id, status, chosen_recommendation, offer, demo_url")
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

  const agentSlug = findAgentSlug(chosenRec.niche);
  const agent = agentSlug ? getAgentForNiche(agentSlug) : null;

  if (!agent) {
    notFound();
  }

  const offer = system.offer as {
    segment?: string;
    system_description?: string;
    transformation_to?: string;
  } | null;

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
