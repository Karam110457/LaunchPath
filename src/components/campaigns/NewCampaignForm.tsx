"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Globe, Loader2, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
  lockedClientId?: string;
  redirectBase?: string;
}

type ChannelType = "widget" | "whatsapp";

const CHANNEL_OPTIONS: {
  value: ChannelType;
  label: string;
  description: string;
  icon: typeof Globe;
}[] = [
  {
    value: "widget",
    label: "Website Widget",
    description: "Embed a chat widget on any website",
    icon: Globe,
  },
  {
    value: "whatsapp",
    label: "WhatsApp",
    description: "Connect a WhatsApp Business number",
    icon: MessageCircle,
  },
];

/** Inline style for gradient border via background-clip trick */
const gradientBorderStyle: React.CSSProperties = {
  backgroundImage:
    "linear-gradient(var(--card-bg), var(--card-bg)), linear-gradient(135deg, #FF8C00, #9D50BB)",
  backgroundOrigin: "border-box",
  backgroundClip: "padding-box, border-box",
};

export function NewCampaignForm({ agents, lockedClientId, redirectBase }: NewCampaignFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedClientId = lockedClientId ?? searchParams.get("clientId") ?? "";
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [channelType, setChannelType] = useState<ChannelType>("widget");
  const [name, setName] = useState("");
  const [agentId, setAgentId] = useState(agents[0]?.id ?? "");
  const [clientId, setClientId] = useState(preselectedClientId);
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
          channel_type: channelType,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create campaign");
      }

      const { campaign } = await res.json();
      const base = redirectBase ? `${redirectBase}/${campaign.id}` : `/dashboard/clients`;
      const url = channelType === "whatsapp" ? `${base}?channel=whatsapp` : base;
      router.push(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setSaving(false);
    }
  }

  if (agents.length === 0) {
    return (
      <div className="max-w-lg rounded-[32px] border border-black/5 dark:border-[#2A2A2A] bg-[#f8f9fa] dark:bg-[#1E1E1E]/80 p-8 text-center">
        <p className="text-sm text-muted-foreground mb-4">
          You need at least one agent to create a campaign.
        </p>
        <Button onClick={() => router.push("/dashboard/agents/new")}>
          Create an Agent
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-lg rounded-[32px] border border-black/5 dark:border-[#2A2A2A] bg-[#f8f9fa] dark:bg-[#1E1E1E]/80 p-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Channel Type Selection */}
        <div className="space-y-2.5">
          <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Channel Type
          </Label>
          <div className="grid grid-cols-2 gap-3">
            {CHANNEL_OPTIONS.map((opt) => {
              const Icon = opt.icon;
              const isSelected = channelType === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setChannelType(opt.value)}
                  style={isSelected ? gradientBorderStyle : undefined}
                  className={`text-left px-4 py-3.5 rounded-[20px] border-2 transition-all duration-200 ${
                    isSelected
                      ? "[--card-bg:#f8f9fa] dark:[--card-bg:#1E1E1E] border-transparent shadow-sm"
                      : "border-black/5 dark:border-[#2A2A2A] hover:bg-white dark:hover:bg-[#252525] hover:shadow-sm"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                        isSelected
                          ? "gradient-accent-bg"
                          : "bg-neutral-200/60 dark:bg-neutral-700/40"
                      }`}
                    >
                      <Icon
                        className={`w-4 h-4 ${
                          isSelected ? "text-white" : "text-muted-foreground"
                        }`}
                      />
                    </div>
                    <div>
                      <p
                        className={`text-sm font-medium ${
                          isSelected ? "text-foreground" : "text-muted-foreground"
                        }`}
                      >
                        {opt.label}
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {opt.description}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <hr className="border-black/5 dark:border-[#2A2A2A]" />

        {/* Campaign Name */}
        <div className="space-y-1.5">
          <Label htmlFor="campaign-name">Campaign Name</Label>
          <Input
            id="campaign-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={
              channelType === "whatsapp"
                ? "e.g., Acme Corp WhatsApp Support"
                : "e.g., Acme Corp Website Widget"
            }
            className="rounded-xl"
            required
          />
        </div>

        {/* Agent */}
        <div className="space-y-1.5">
          <Label htmlFor="agent-select">Agent</Label>
          <select
            id="agent-select"
            value={agentId}
            onChange={(e) => setAgentId(e.target.value)}
            className="flex h-9 w-full rounded-xl border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            required
          >
            {agents.map((agent) => (
              <option key={agent.id} value={agent.id}>
                {agent.name}
              </option>
            ))}
          </select>
          <p className="text-[11px] text-muted-foreground">
            The AI agent that will power this campaign.
          </p>
        </div>

        {/* Client selector */}
        {!lockedClientId && clients.length > 0 && (
          <div className="space-y-1.5">
            <Label htmlFor="client-select">Client</Label>
            <select
              id="client-select"
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              className="flex h-9 w-full rounded-xl border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
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

        {/* Client Name */}
        <div className="space-y-1.5">
          <Label htmlFor="client-name">Client Name (optional)</Label>
          <Input
            id="client-name"
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
            placeholder="e.g., Acme Corp"
            className="rounded-xl"
          />
        </div>

        {/* Client Website — only relevant for widget */}
        {channelType === "widget" && (
          <div className="space-y-1.5">
            <Label htmlFor="client-website">Client Website (optional)</Label>
            <Input
              id="client-website"
              value={clientWebsite}
              onChange={(e) => setClientWebsite(e.target.value)}
              placeholder="e.g., https://acmecorp.com"
              className="rounded-xl"
            />
            <p className="text-[11px] text-muted-foreground">
              Used to preview how the widget looks on the client&apos;s site.
            </p>
          </div>
        )}

        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}

        <div className="flex gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            className="rounded-full"
            onClick={() => router.push(redirectBase ?? (preselectedClientId ? `/dashboard/clients/${preselectedClientId}` : "/dashboard/clients"))}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={saving || !name.trim() || !agentId}
            className="shadow-md gradient-accent-bg text-white hover:scale-[1.02] transition-transform border-0 rounded-full"
          >
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
    </div>
  );
}
