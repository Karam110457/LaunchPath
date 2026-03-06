"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Rocket, Pause, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
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
}

export function CampaignBuilder({
  campaign,
  channels: initialChannels,
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
  const agentEmoji =
    (agentData?.personality as { avatar_emoji?: string } | null)
      ?.avatar_emoji ?? "\u{1F916}";

  return (
    <div className="flex flex-col h-screen">
      {/* Top bar */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-border shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/dashboard/campaigns")}
            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-sm font-semibold text-foreground">
              {campaign.name}
            </h1>
            <p className="text-xs text-muted-foreground">
              {agentEmoji} {agentData?.name ?? "Unknown agent"}
              {campaign.clients?.name
                ? ` \u2022 ${campaign.clients.name}`
                : campaign.client_name
                  ? ` \u2022 ${campaign.client_name}`
                  : null}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {error && (
            <span className="text-xs text-destructive mr-2">{error}</span>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={handleSaveDraft}
            disabled={saving || deploying}
          >
            {saving ? (
              <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
            ) : (
              <Save className="w-3.5 h-3.5 mr-1.5" />
            )}
            Save
          </Button>

          {status === "active" ? (
            <Button
              variant="outline"
              size="sm"
              onClick={handlePause}
              disabled={saving || deploying}
            >
              <Pause className="w-3.5 h-3.5 mr-1.5" />
              Pause
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={handleDeploy}
              disabled={saving || deploying}
            >
              {deploying ? (
                <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
              ) : (
                <Rocket className="w-3.5 h-3.5 mr-1.5" />
              )}
              Deploy
            </Button>
          )}
        </div>
      </div>

      {/* Main content — split layout */}
      <div className="flex flex-1 overflow-hidden">
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
