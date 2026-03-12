import { requireAuth } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { TopNav } from "@/components/layout/TopNav";
import { GlobalBackground } from "@/components/layout/GlobalBackground";
import { AgentCreationLanding } from "@/components/agents/AgentCreationLanding";
import type { WizardGenerationPayload } from "@/types/agent-wizard";

interface Props {
  searchParams: Promise<{ regenerate?: string }>;
}

export default async function NewAgentPage({ searchParams }: Props) {
  const user = await requireAuth();
  const { regenerate } = await searchParams;

  let initialWizardConfig: WizardGenerationPayload | null = null;

  if (regenerate) {
    const supabase = await createClient();
    const { data } = await supabase
      .from("ai_agents")
      .select("wizard_config")
      .eq("id", regenerate)
      .eq("user_id", user.id)
      .single();

    if (data?.wizard_config) {
      initialWizardConfig = data.wizard_config as WizardGenerationPayload;
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col antialiased relative overflow-hidden">
      <GlobalBackground />

      <div className="relative z-10 flex flex-col flex-1 h-full">
        <TopNav />
        <div className="flex-1 w-full max-w-5xl mx-auto px-6 py-8 animate-in fade-in slide-in-from-bottom-2 duration-300 fill-mode-both">
          <AgentCreationLanding initialWizardConfig={initialWizardConfig} />
        </div>
      </div>
    </div>
  );
}
