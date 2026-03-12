"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Rocket, Pause, Save } from "lucide-react";
import { cn } from "@/lib/utils";
import { ConfigPanel } from "./ConfigPanel";
import { PreviewPanel } from "./PreviewPanel";
import type { WidgetConfig } from "@/lib/channels/types";
import type { ChannelResponse } from "@/lib/channels/types";

interface CampaignData {
  id: string;
  name: string;
  agent_id: string;
  client_name: string | null;
  client_website: string | null;
  client_id: string | null;
  clients: { id: string; name: string; website: string | null; logo_url: string | null } | null;
  status: string;
  ai_agents:
    | { id: string; name: string; personality: unknown }
    | { id: string; name: string; personality: unknown }[]
    | null;
}

interface CampaignBuilderProps {
  campaign: CampaignData;
  channels: ChannelResponse[];
  backUrl?: string;
}

export function CampaignBuilder({
  campaign,
  channels: initialChannels,
  backUrl = "/dashboard/clients",
}: CampaignBuilderProps) {
  const router = useRouter();

  // Find existing widget channel for this campaign
  const existingChannel = initialChannels.find(
    (ch) => ch.channel_type === "widget"
  );

  const [config, setConfig] = useState<WidgetConfig>(
    (existingChannel?.config as WidgetConfig) ?? {}
  );
  const [clientWebsite, setClientWebsite] = useState(
    campaign.client_website ?? ""
  );
  const [allowedOrigins, setAllowedOrigins] = useState(
    existingChannel?.allowed_origins?.join("\n") ?? ""
  );
  const [channel, setChannel] = useState<ChannelResponse | null>(
    existingChannel ?? null
  );
  const [status, setStatus] = useState(campaign.status);
  const [saving, setSaving] = useState(false);
  const [deploying, setDeploying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [screenshotUrl, setScreenshotUrl] = useState<string | null>(null);

  const agentId = campaign.agent_id;
  const token = channel?.token ?? "";
  const appOrigin =
    typeof window !== "undefined" ? window.location.origin : "";

  const embedCode = channel
    ? `<script src="${appOrigin}/widget.js" data-channel="${channel.id}" async></script>`
    : null;

  const originsArray = allowedOrigins
    .split("\n")
    .map((o) => o.trim())
    .filter(Boolean);

  const saveChannel = useCallback(
    async (enabled: boolean) => {
      const channelBody = {
        channel_type: "widget",
        name: `${campaign.name} Widget`,
        config,
        allowed_origins: originsArray,
        campaign_id: campaign.id,
        is_enabled: enabled,
      };

      if (channel) {
        // Update existing
        const res = await fetch(
          `/api/agents/${agentId}/channels/${channel.id}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              config,
              allowed_origins: originsArray,
              is_enabled: enabled,
            }),
          }
        );
        if (!res.ok) throw new Error("Failed to update channel");
        const data = await res.json();
        setChannel(data.channel);
      } else {
        // Create new
        const res = await fetch(`/api/agents/${agentId}/channels`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(channelBody),
        });
        if (!res.ok) throw new Error("Failed to create channel");
        const data = await res.json();
        setChannel(data.channel);
      }
    },
    [channel, config, originsArray, agentId, campaign.id, campaign.name]
  );

  async function handleSaveDraft() {
    setSaving(true);
    setError(null);
    try {
      await saveChannel(channel?.is_enabled ?? false);

      // Update campaign
      await fetch(`/api/campaigns/${campaign.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_website: clientWebsite.trim() || null,
        }),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeploy() {
    setDeploying(true);
    setError(null);
    try {
      await saveChannel(true);

      await fetch(`/api/campaigns/${campaign.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "active",
          client_website: clientWebsite.trim() || null,
        }),
      });

      setStatus("active");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Deploy failed");
    } finally {
      setDeploying(false);
    }
  }

  async function handlePause() {
    setSaving(true);
    setError(null);
    try {
      if (channel) {
        await fetch(`/api/agents/${agentId}/channels/${channel.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ is_enabled: false }),
        });
        setChannel({ ...channel, is_enabled: false });
      }

      await fetch(`/api/campaigns/${campaign.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "paused" }),
      });

      setStatus("paused");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Pause failed");
    } finally {
      setSaving(false);
    }
  }

  const agentData = Array.isArray(campaign.ai_agents)
    ? campaign.ai_agents[0]
    : campaign.ai_agents;

  return (
    <div className="flex flex-col h-screen">
      {/* Top bar */}
      <div className="flex items-center justify-between px-5 pt-4 pb-2 shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push(backUrl)}
            className="p-2 rounded-full border border-border/40 bg-card/60 backdrop-blur-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors duration-150"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-sm font-semibold text-foreground">
              {campaign.name}
            </h1>
            <p className="text-xs text-muted-foreground">
              {agentData?.name ?? "Unknown agent"}
              {campaign.clients?.name
                ? ` \u2022 ${campaign.clients.name}`
                : campaign.client_name
                  ? ` \u2022 ${campaign.client_name}`
                  : null}
            </p>
          </div>
          <span
            className={cn(
              "text-[10px] px-2.5 py-0.5 rounded-full font-medium ml-1",
              status === "active"
                ? "bg-gradient-to-r from-[#FF8C00]/10 to-[#9D50BB]/10 text-neutral-900 dark:text-neutral-100 border border-[#FF8C00]/20"
                : status === "paused"
                ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                : "bg-muted text-muted-foreground border border-border"
            )}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {error && (
            <span className="text-xs text-destructive mr-2">{error}</span>
          )}

          <button
            onClick={handleSaveDraft}
            disabled={saving || deploying}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium rounded-full border border-border/40 bg-card/60 backdrop-blur-md hover:bg-muted/50 transition-colors duration-150 disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Save className="w-3.5 h-3.5" />
            )}
            Save
          </button>

          {status === "active" ? (
            <button
              onClick={handlePause}
              disabled={saving || deploying}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 transition-colors duration-150 disabled:opacity-50"
            >
              <Pause className="w-3.5 h-3.5" />
              Pause
            </button>
          ) : (
            <button
              onClick={handleDeploy}
              disabled={saving || deploying}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium rounded-full gradient-accent-bg text-white shadow-sm hover:scale-[1.02] transition-transform duration-150 disabled:opacity-50"
            >
              {deploying ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Rocket className="w-3.5 h-3.5" />
              )}
              Deploy
            </button>
          )}
        </div>
      </div>

      {/* Main content — floating card layout */}
      <div className="flex flex-1 gap-4 px-5 pb-5 pt-2 overflow-hidden">
        <ConfigPanel
          config={config}
          onChange={setConfig}
          clientWebsite={clientWebsite}
          onClientWebsiteChange={setClientWebsite}
          allowedOrigins={allowedOrigins}
          onAllowedOriginsChange={setAllowedOrigins}
          embedCode={status === "active" ? embedCode : null}
        />
        <PreviewPanel
          config={config}
          token={token}
          agentId={agentId}
          clientWebsite={clientWebsite}
          screenshotUrl={screenshotUrl}
          onScreenshotChange={setScreenshotUrl}
        />
      </div>
    </div>
  );
}
