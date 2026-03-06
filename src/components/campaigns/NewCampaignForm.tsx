"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";

interface Agent {
  id: string;
  name: string;
  personality: unknown;
}

interface ClientOption {
  id: string;
  name: string;
}

interface NewCampaignFormProps {
  agents: Agent[];
}

export function NewCampaignForm({ agents }: NewCampaignFormProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [agentId, setAgentId] = useState(agents[0]?.id ?? "");
  const [clientId, setClientId] = useState("");
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [clientName, setClientName] = useState("");
  const [clientWebsite, setClientWebsite] = useState("");

  useEffect(() => {
    fetch("/api/clients")
      .then((r) => r.json())
      .then((data) => setClients(data.clients ?? []))
      .catch(() => {});
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !agentId) return;

    setSaving(true);
    setError(null);

    try {
      const res = await fetch("/api/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          agent_id: agentId,
          client_id: clientId || null,
          client_name: clientName.trim() || null,
          client_website: clientWebsite.trim() || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create campaign");
      }

      const { campaign } = await res.json();
      router.push(`/dashboard/campaigns/${campaign.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setSaving(false);
    }
  }

  if (agents.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6 text-center py-12">
          <p className="text-sm text-muted-foreground mb-4">
            You need at least one agent to create a campaign.
          </p>
          <Button onClick={() => router.push("/dashboard/agents/new")}>
            Create an Agent
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-lg">
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <Label htmlFor="campaign-name">Campaign Name</Label>
            <Input
              id="campaign-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Acme Corp Website Widget"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="agent-select">Agent</Label>
            <select
              id="agent-select"
              value={agentId}
              onChange={(e) => setAgentId(e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              required
            >
              {agents.map((agent) => {
                const emoji =
                  (agent.personality as { avatar_emoji?: string } | null)
                    ?.avatar_emoji ?? "\u{1F916}";
                return (
                  <option key={agent.id} value={agent.id}>
                    {emoji} {agent.name}
                  </option>
                );
              })}
            </select>
            <p className="text-[11px] text-muted-foreground">
              The AI agent that will power this campaign&apos;s chat widget.
            </p>
          </div>

          {clients.length > 0 && (
            <div className="space-y-1.5">
              <Label htmlFor="client-select">Client (optional)</Label>
              <select
                id="client-select"
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="">No client</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-muted-foreground">
                Link this campaign to a client for portal access.
              </p>
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="client-name">Client Name (optional)</Label>
            <Input
              id="client-name"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="e.g., Acme Corp"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="client-website">Client Website (optional)</Label>
            <Input
              id="client-website"
              value={clientWebsite}
              onChange={(e) => setClientWebsite(e.target.value)}
              placeholder="e.g., https://acmecorp.com"
            />
            <p className="text-[11px] text-muted-foreground">
              Used to preview how the widget looks on the client&apos;s site.
            </p>
          </div>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/dashboard/campaigns")}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={saving || !name.trim() || !agentId}>
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Campaign"
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
