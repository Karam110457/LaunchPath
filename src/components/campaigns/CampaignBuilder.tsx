"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Rocket, Pause, Save, MessageCircle, Settings2, FileText, Users, Send } from "lucide-react";
import { cn } from "@/lib/utils";
import { ConfigPanel } from "./ConfigPanel";
import { PreviewPanel } from "./PreviewPanel";
import { WhatsAppConfigPanel } from "./WhatsAppConfigPanel";
import { TemplatesTab } from "./whatsapp/TemplatesTab";
import type { WidgetConfig, WhatsAppConfig } from "@/lib/channels/types";
import type { ChannelResponse } from "@/lib/channels/types";

type WhatsAppTab = "settings" | "templates" | "contacts" | "sends";

const WA_TABS: { id: WhatsAppTab; label: string; icon: typeof Settings2; enabled: boolean }[] = [
  { id: "settings", label: "Settings", icon: Settings2, enabled: true },
  { id: "templates", label: "Templates", icon: FileText, enabled: true },
  { id: "contacts", label: "Contacts", icon: Users, enabled: false },
  { id: "sends", label: "Sends", icon: Send, enabled: false },
];

const tabGradientStyle: React.CSSProperties = {
  backgroundImage:
    "linear-gradient(var(--card-bg), var(--card-bg)), linear-gradient(135deg, #FF8C00, #9D50BB)",
  backgroundOrigin: "border-box",
  backgroundClip: "padding-box, border-box",
};

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

type ChannelType = "widget" | "whatsapp";

interface CampaignBuilderProps {
  campaign: CampaignData;
  channels: ChannelResponse[];
  backUrl?: string;
  initialChannelType?: ChannelType;
}

export function CampaignBuilder({
  campaign,
  channels: initialChannels,
  backUrl = "/dashboard/clients",
  initialChannelType,
}: CampaignBuilderProps) {
  const router = useRouter();

  // Determine channel type from existing channels or initial prop
  const existingWhatsApp = initialChannels.find((ch) => ch.channel_type === "whatsapp");
  const existingWidget = initialChannels.find((ch) => ch.channel_type === "widget");
  const channelType: ChannelType = existingWhatsApp
    ? "whatsapp"
    : existingWidget
      ? "widget"
      : initialChannelType ?? "widget";

  const isWhatsApp = channelType === "whatsapp";
  const existingChannel = isWhatsApp ? existingWhatsApp : existingWidget;

  // Widget state
  const [widgetConfig, setWidgetConfig] = useState<WidgetConfig>(
    (!isWhatsApp ? (existingChannel?.config as WidgetConfig) : null) ?? {}
  );
  const [clientWebsite, setClientWebsite] = useState(
    campaign.client_website ?? ""
  );
  const [allowedOrigins, setAllowedOrigins] = useState(
    (!isWhatsApp ? existingChannel?.allowed_origins?.join("\n") : null) ?? ""
  );

  // WhatsApp state
  const [waConfig, setWaConfig] = useState<Partial<WhatsAppConfig>>(
    isWhatsApp ? ((existingChannel?.config ?? {}) as Partial<WhatsAppConfig>) : {}
  );
  const [rateLimitRpm, setRateLimitRpm] = useState(
    existingChannel?.rate_limit_rpm?.toString() ?? ""
  );

  // WhatsApp tab state
  const [waTab, setWaTab] = useState<WhatsAppTab>("settings");

  // Shared state
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

  const embedCode = channel && !isWhatsApp
    ? `<script src="${appOrigin}/widget.js" data-channel="${channel.id}" async></script>`
    : null;

  const webhookUrl =
    isWhatsApp && channel?.webhook_path
      ? `${appOrigin}/api/webhooks/whatsapp/${channel.webhook_path}`
      : null;

  const originsArray = allowedOrigins
    .split("\n")
    .map((o) => o.trim())
    .filter(Boolean);

  const saveChannel = useCallback(
    async (enabled: boolean) => {
      if (isWhatsApp) {
        // WhatsApp channel
        const config: Record<string, unknown> = {
          phoneNumberId: waConfig.phoneNumberId,
          businessAccountId: waConfig.businessAccountId || undefined,
          accessToken: waConfig.accessToken,
          verifyToken: waConfig.verifyToken,
          responseDelay: waConfig.responseDelay ?? 2000,
          readReceipts: waConfig.readReceipts !== false,
          greetingMessage: waConfig.greetingMessage || undefined,
        };
        const rpm = rateLimitRpm ? parseInt(rateLimitRpm, 10) : undefined;

        if (channel) {
          const res = await fetch(
            `/api/agents/${agentId}/channels/${channel.id}`,
            {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                name: `${campaign.name} WhatsApp`,
                config,
                rate_limit_rpm: rpm ?? null,
                is_enabled: enabled,
              }),
            }
          );
          if (!res.ok) throw new Error("Failed to update channel");
          const data = await res.json();
          setChannel(data.channel);
        } else {
          const res = await fetch(`/api/agents/${agentId}/channels`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              channel_type: "whatsapp",
              name: `${campaign.name} WhatsApp`,
              config,
              rate_limit_rpm: rpm,
              campaign_id: campaign.id,
              is_enabled: enabled,
            }),
          });
          if (!res.ok) {
            const errData = await res.json();
            throw new Error(errData.error || "Failed to create channel");
          }
          const data = await res.json();
          setChannel(data.channel);
        }
      } else {
        // Widget channel (existing logic)
        const channelBody = {
          channel_type: "widget",
          name: `${campaign.name} Widget`,
          config: widgetConfig,
          allowed_origins: originsArray,
          campaign_id: campaign.id,
          is_enabled: enabled,
        };

        if (channel) {
          const res = await fetch(
            `/api/agents/${agentId}/channels/${channel.id}`,
            {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                config: widgetConfig,
                allowed_origins: originsArray,
                is_enabled: enabled,
              }),
            }
          );
          if (!res.ok) throw new Error("Failed to update channel");
          const data = await res.json();
          setChannel(data.channel);
        } else {
          const res = await fetch(`/api/agents/${agentId}/channels`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(channelBody),
          });
          if (!res.ok) throw new Error("Failed to create channel");
          const data = await res.json();
          setChannel(data.channel);
        }
      }
    },
    [channel, widgetConfig, waConfig, originsArray, rateLimitRpm, agentId, campaign.id, campaign.name, isWhatsApp]
  );

  // Validation for WhatsApp deploy
  const canDeployWhatsApp =
    !!waConfig.phoneNumberId?.trim() &&
    !!waConfig.accessToken?.trim() &&
    !!waConfig.verifyToken?.trim();

  async function handleSaveDraft() {
    setSaving(true);
    setError(null);
    try {
      await saveChannel(channel?.is_enabled ?? false);

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

  const deployDisabled = isWhatsApp
    ? saving || deploying || !canDeployWhatsApp
    : saving || deploying;

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
          {/* Channel type badge */}
          {isWhatsApp && (
            <span className="inline-flex items-center gap-1 text-[10px] px-2.5 py-0.5 rounded-full font-medium bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20">
              <MessageCircle className="w-3 h-3" />
              WhatsApp
            </span>
          )}
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
              disabled={deployDisabled}
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
        {isWhatsApp ? (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* WhatsApp Tab Bar */}
            <div className="flex items-center p-1.5 rounded-full border border-border/40 bg-card/60 backdrop-blur-md w-fit shadow-sm mb-4 shrink-0">
              {WA_TABS.map((tab) => {
                const Icon = tab.icon;
                const isActive = waTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => tab.enabled && setWaTab(tab.id)}
                    disabled={!tab.enabled}
                    style={isActive ? tabGradientStyle : undefined}
                    className={cn(
                      "flex items-center gap-1.5 px-4 py-1.5 text-xs font-medium rounded-full border-2 transition-all",
                      isActive
                        ? "[--card-bg:#fff] dark:[--card-bg:#171717] border-transparent text-foreground"
                        : tab.enabled
                          ? "border-transparent text-muted-foreground hover:text-foreground"
                          : "border-transparent text-muted-foreground/40 cursor-not-allowed"
                    )}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {tab.label}
                    {!tab.enabled && (
                      <span className="text-[9px] ml-0.5 opacity-60">Soon</span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* WhatsApp Tab Content */}
            <div className="flex-1 overflow-hidden">
              {waTab === "settings" && (
                <div className="flex gap-4 h-full">
                  <WhatsAppConfigPanel
                    config={waConfig}
                    onChange={setWaConfig}
                    rateLimitRpm={rateLimitRpm}
                    onRateLimitChange={setRateLimitRpm}
                    webhookUrl={webhookUrl}
                    verifyTokenDisplay={waConfig.verifyToken ?? ""}
                  />
                  {/* WhatsApp status panel (right side) */}
                  <div className="flex-1 flex items-center justify-center">
                    <div className="max-w-md w-full rounded-[32px] border border-black/5 dark:border-[#2A2A2A] bg-[#f8f9fa] dark:bg-[#1E1E1E]/80 p-8 text-center space-y-5">
                      <div className="w-16 h-16 rounded-2xl gradient-accent-bg flex items-center justify-center mx-auto">
                        <MessageCircle className="w-8 h-8 text-white" />
                      </div>
                      <div className="space-y-1.5">
                        <h3 className="text-base font-semibold text-foreground">
                          WhatsApp Campaign
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {status === "active"
                            ? "Your WhatsApp channel is live and receiving messages."
                            : status === "paused"
                              ? "Your WhatsApp channel is paused. Deploy to start receiving messages."
                              : "Configure your Meta API credentials, then deploy to start receiving WhatsApp messages."}
                        </p>
                      </div>

                      {/* Connection status */}
                      <div className="rounded-[20px] border border-black/5 dark:border-[#2A2A2A] bg-white dark:bg-[#151515] p-4 space-y-3 text-left">
                        <StatusRow
                          label="Credentials"
                          ok={canDeployWhatsApp}
                          detail={canDeployWhatsApp ? "Configured" : "Missing required fields"}
                        />
                        <StatusRow
                          label="Channel"
                          ok={!!channel}
                          detail={channel ? "Created" : "Will be created on save"}
                        />
                        <StatusRow
                          label="Webhook"
                          ok={!!webhookUrl}
                          detail={webhookUrl ? "Ready" : "Available after first save"}
                        />
                        <StatusRow
                          label="Status"
                          ok={status === "active"}
                          detail={status === "active" ? "Live" : "Not deployed"}
                        />
                      </div>

                      {channel && (
                        <p className="text-[11px] text-muted-foreground">
                          Channel ID: <code className="font-mono text-[10px]">{channel.id.slice(0, 8)}...</code>
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {waTab === "templates" && channel && (
                <div className="h-full overflow-y-auto rounded-[2rem] bg-white/70 dark:bg-neutral-900/70 backdrop-blur-xl border border-white/60 dark:border-neutral-700/40 shadow-[0_8px_32px_rgba(0,0,0,0.04)] p-6">
                  <TemplatesTab
                    agentId={agentId}
                    channelId={channel.id}
                    hasBusinessAccountId={!!waConfig.businessAccountId?.trim()}
                  />
                </div>
              )}

              {waTab === "templates" && !channel && (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center max-w-xs">
                    <FileText className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
                    <p className="text-sm font-medium text-foreground mb-1">
                      Save Settings First
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Configure and save your WhatsApp credentials in the
                      Settings tab before managing templates.
                    </p>
                  </div>
                </div>
              )}

              {(waTab === "contacts" || waTab === "sends") && (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center max-w-xs">
                    <Users className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
                    <p className="text-sm font-medium text-foreground mb-1">
                      Coming Soon
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Contact management and outbound sending will be available
                      in the next update.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <>
            <ConfigPanel
              config={widgetConfig}
              onChange={setWidgetConfig}
              clientWebsite={clientWebsite}
              onClientWebsiteChange={setClientWebsite}
              allowedOrigins={allowedOrigins}
              onAllowedOriginsChange={setAllowedOrigins}
              embedCode={status === "active" ? embedCode : null}
            />
            <PreviewPanel
              config={widgetConfig}
              token={token}
              agentId={agentId}
              clientWebsite={clientWebsite}
              screenshotUrl={screenshotUrl}
              onScreenshotChange={setScreenshotUrl}
            />
          </>
        )}
      </div>
    </div>
  );
}

/** Small status indicator row */
function StatusRow({
  label,
  ok,
  detail,
}: {
  label: string;
  ok: boolean;
  detail: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs font-medium text-foreground">{label}</span>
      <div className="flex items-center gap-1.5">
        <span className="text-[11px] text-muted-foreground">{detail}</span>
        <span
          className={cn(
            "w-2 h-2 rounded-full shrink-0",
            ok ? "bg-emerald-500" : "bg-neutral-300 dark:bg-neutral-600"
          )}
        />
      </div>
    </div>
  );
}
