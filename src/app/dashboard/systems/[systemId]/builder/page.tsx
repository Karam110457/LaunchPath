import { requireAuth } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { BuilderPage } from "@/components/builder/BuilderPage";
import type { DemoConfig } from "@/lib/ai/schemas";

interface Props {
  params: Promise<{ systemId: string }>;
}

export default async function BuilderRoute({ params }: Props) {
  const { systemId } = await params;
  const user = await requireAuth();
  const supabase = await createClient();

  const { data: system } = await supabase
    .from("user_systems")
    .select("id, status, chosen_recommendation, offer, demo_config, page_code")
    .eq("id", systemId)
    .eq("user_id", user.id)
    .single();

  if (!system || !system.demo_config) {
    notFound();
  }

  const demoConfig = system.demo_config as DemoConfig;

  const offer = system.offer as {
    segment?: string;
    system_description?: string;
    transformation_from?: string;
    transformation_to?: string;
  } | null;

  const chosenRec = system.chosen_recommendation as {
    niche: string;
    your_solution: string;
    target_segment: { description: string };
  } | null;

  return (
    <div className="h-[calc(100vh-3.5rem)] overflow-hidden">
      <BuilderPage
        systemId={system.id}
        initialConfig={demoConfig}
        initialPageCode={system.page_code as string | null}
        segment={offer?.segment ?? chosenRec?.target_segment.description ?? ""}
        transformationFrom={offer?.transformation_from}
        transformationTo={offer?.transformation_to}
        businessName={chosenRec?.niche ?? ""}
        solution={chosenRec?.your_solution ?? ""}
      />
    </div>
  );
}
