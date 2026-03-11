import { requireAuth } from "@/lib/auth/guards";
import { AgentCreationLanding } from "@/components/agents/AgentCreationLanding";

export default async function NewAgentPage() {
  await requireAuth();

  return (
    <div className="container py-6 max-w-5xl mx-auto animate-in fade-in duration-200">
      <AgentCreationLanding />
    </div>
  );
}
