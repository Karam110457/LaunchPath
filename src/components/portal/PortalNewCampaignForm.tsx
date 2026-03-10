"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface PortalNewCampaignFormProps {
  agents: Array<{ id: string; name: string }>;
}

export function PortalNewCampaignForm({ agents }: PortalNewCampaignFormProps) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [agentId, setAgentId] = useState(agents[0]?.id ?? "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !agentId) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/portal/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), agent_id: agentId }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Failed to create campaign");
        return;
      }

      const { campaign } = await res.json();
      router.push(`/portal/campaigns/${campaign.id}`);
    } catch {
      setError("Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (agents.length === 0) {
    return (
      <div className="rounded-xl border bg-card p-8 text-center">
        <p className="text-muted-foreground">
          No agents have been assigned to your account yet. Please contact your agency to assign an agent.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-2">
        <label className="text-sm font-medium">Campaign Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Website Support"
          className="w-full px-4 py-2.5 text-sm rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/40"
          required
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Agent</label>
        <select
          value={agentId}
          onChange={(e) => setAgentId(e.target.value)}
          className="w-full px-4 py-2.5 text-sm rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/40"
        >
          {agents.map((agent) => (
            <option key={agent.id} value={agent.id}>
              {agent.name}
            </option>
          ))}
        </select>
        <p className="text-xs text-muted-foreground">
          Choose which AI agent will handle conversations for this campaign.
        </p>
      </div>

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      <button
        type="submit"
        disabled={isSubmitting || !name.trim() || !agentId}
        className="w-full px-4 py-2.5 text-sm font-medium rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
      >
        {isSubmitting ? "Creating..." : "Create Campaign"}
      </button>
    </form>
  );
}
