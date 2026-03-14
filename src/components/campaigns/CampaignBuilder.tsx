"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Loader2,
  Rocket,
  Pause,
  Save,
  MessageCircle,
  Settings2,
  FileText,
  Users,
  Send,
  CheckCircle2,
  Circle,
  Copy,
  Check,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ConfigPanel } from "./ConfigPanel";
import { PreviewPanel } from "./PreviewPanel";
import { WhatsAppConfigPanel } from "./WhatsAppConfigPanel";
import { TemplatesTab } from "./whatsapp/TemplatesTab";
import { ContactsTab } from "./whatsapp/ContactsTab";
import { SendsTab } from "./whatsapp/SendsTab";
import { SequencesTab } from "./whatsapp/SequencesTab";
import type { WidgetConfig, WhatsAppConfig } from "@/lib/channels/types";
import type { ChannelResponse } from "@/lib/channels/types";

// ---------------------------------------------------------------------------
// Types & constants
// ---------------------------------------------------------------------------

type WhatsAppTab = "settings" | "templates" | "contacts" | "sends" | "sequences";

const WA_TABS: {
  id: WhatsAppTab;
  label: string;
  icon: typeof Settings2;
}[] = [
  { id: "settings", label: "Settings", icon: Settings2 },
  { id: "templates", label: "Templates", icon: FileText },
  { id: "contacts", label: "Contacts", icon: Users },
  { id: "sends", label: "Sends", icon: Send },
  { id: "sequences", label: "Sequences", icon: Zap },
];

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

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function CampaignBuilder({
  campaign,
  channels: initialChannels,
  backUrl = "/dashboard/clients",
  initialChannelType,
}: CampaignBuilderProps) {
  const router = useRouter();

  // Determine channel type
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
  const [waTab, setWaTab] = useState<WhatsAppTab>("settings");

  // Shared state
  const [channel, setChannel] = useState<ChannelResponse | null>(existingChannel ?? null);
  const [status, setStatus] = useState(campaign.status);
  const [saving, setSaving] = useState(false);
  const [deploying, setDeploying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [screenshotUrl, setScreenshotUrl] = useState<string | null>(null);
  const [webhookCopied, setWebhookCopied] = useState(false);
  const [approvedTemplates, setApprovedTemplates] = useState<{ id: string; name: string; language: string; status: string }[]>([]);
  const [tabTransition, setTabTransition] = useState(false);
  const prevTabRef = useRef<WhatsAppTab>(waTab);

  const agentId = campaign.agent_id;
  const token = channel?.token ?? "";

  // Animate tab content on switch
  const switchWaTab = useCallback((next: WhatsAppTab) => {
    if (next === waTab) return;
    setTabTransition(true);
    const timeout = setTimeout(() => {
      prevTabRef.current = next;
      setWaTab(next);
      // Re-enable after a frame so the new content fades in
      requestAnimationFrame(() => setTabTransition(false));
    }, 120);
    return () => clearTimeout(timeout);
  }, [waTab]);

  // Fetch approved templates for fallback selector
  useEffect(() => {
    if (!isWhatsApp || !channel) return;
    fetch(`/api/agents/${agentId}/channels/${channel.id}/templates?status=APPROVED`)
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data?.templates) setApprovedTemplates(data.templates);
      })
      .catch(() => {});
  }, [isWhatsApp, channel, agentId]);
  const appOrigin = typeof window !== "undefined" ? window.location.origin : "";

  const embedCode = channel && !isWhatsApp
    ? `<script src="${appOrigin}/widget.js" data-channel="${channel.id}" async></script>`
    : null;

  const webhookUrl = isWhatsApp && channel?.webhook_path
    ? `${appOrigin}/api/webhooks/whatsapp/${channel.webhook_path}`
    : null;

  const originsArray = allowedOrigins.split("\n").map((o) => o.trim()).filter(Boolean);

  // Validation
  const hasCredentials =
    !!waConfig.phoneNumberId?.trim() &&
    !!waConfig.accessToken?.trim() &&
    !!waConfig.verifyToken?.trim();
  const hasWaba = !!waConfig.businessAccountId?.trim();
  const canDeployWhatsApp = hasCredentials && hasWaba;

  // Setup progress for WhatsApp
  const setupSteps = [
    { label: "Credentials", done: hasCredentials },
    { label: "WABA ID", done: hasWaba },
    { label: "Channel", done: !!channel },
    { label: "Deployed", done: status === "active" },
  ];
  const completedSteps = setupSteps.filter((s) => s.done).length;

  // ── Save / Deploy / Pause logic ──────────────────────────────────────────

  const saveChannel = useCallback(
    async (enabled: boolean) => {
      if (isWhatsApp) {
        const config: Record<string, unknown> = {
          phoneNumberId: waConfig.phoneNumberId,
          businessAccountId: waConfig.businessAccountId || undefined,
          accessToken: waConfig.accessToken,
          verifyToken: waConfig.verifyToken,
          responseDelay: waConfig.responseDelay ?? 2000,
          readReceipts: waConfig.readReceipts !== false,
          greetingMessage: waConfig.greetingMessage || undefined,
          templateFallback: waConfig.templateFallback || undefined,
        };
        const rpm = rateLimitRpm ? parseInt(rateLimitRpm, 10) : undefined;

        if (channel) {
          const res = await fetch(`/api/agents/${agentId}/channels/${channel.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: `${campaign.name} WhatsApp`,
              config,
              rate_limit_rpm: rpm ?? null,
              is_enabled: enabled,
            }),
          });
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
        const channelBody = {
          channel_type: "widget",
          name: `${campaign.name} Widget`,
          config: widgetConfig,
          allowed_origins: originsArray,
          campaign_id: campaign.id,
          is_enabled: enabled,
        };

        if (channel) {
          const res = await fetch(`/api/agents/${agentId}/channels/${channel.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              config: widgetConfig,
              allowed_origins: originsArray,
              is_enabled: enabled,
            }),
          });
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

  function showSuccess(msg: string) {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 3000);
  }

  async function handleSaveDraft() {
    setSaving(true);
    setError(null);
    try {
      await saveChannel(channel?.is_enabled ?? false);
      await fetch(`/api/campaigns/${campaign.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ client_website: clientWebsite.trim() || null }),
      });
      showSuccess("Settings saved successfully");
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
        body: JSON.stringify({ status: "active", client_website: clientWebsite.trim() || null }),
      });
      setStatus("active");
      showSuccess("Campaign deployed successfully");
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

  async function copyWebhookUrl() {
    if (!webhookUrl) return;
    await navigator.clipboard.writeText(webhookUrl);
    setWebhookCopied(true);
    setTimeout(() => setWebhookCopied(false), 2000);
  }

  const agentData = Array.isArray(campaign.ai_agents)
    ? campaign.ai_agents[0]
    : campaign.ai_agents;

  const deployDisabled = isWhatsApp
    ? saving || deploying || !canDeployWhatsApp
    : saving || deploying;

  // ── Page header (shared between widget and WhatsApp) ───────────────────
  const pageHeader = (
    <div className="flex items-center justify-between mb-6 animate-in fade-in slide-in-from-bottom-2 duration-300 fill-mode-both">
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.push(backUrl)}
          className="p-2 rounded-full border border-border/40 bg-card/60 backdrop-blur-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all duration-200 hover:scale-105 active:scale-95"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-lg font-semibold text-foreground">{campaign.name}</h1>
            {isWhatsApp && (
              <span className="inline-flex items-center gap-1 text-[10px] px-2.5 py-0.5 rounded-full font-medium bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20">
                <MessageCircle className="w-3 h-3" />
                WhatsApp
              </span>
            )}
            <span
              className={cn(
                "text-[10px] px-2.5 py-0.5 rounded-full font-medium",
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
          <p className="text-xs text-muted-foreground mt-0.5">
            {agentData?.name ?? "Unknown agent"}
            {campaign.clients?.name
              ? ` \u2022 ${campaign.clients.name}`
              : campaign.client_name
                ? ` \u2022 ${campaign.client_name}`
                : null}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {error && <span className="text-xs text-destructive mr-2">{error}</span>}
        {successMsg && (
          <span className="text-xs text-emerald-600 dark:text-emerald-400 mr-2 flex items-center gap-1 animate-in fade-in slide-in-from-right-2 duration-200">
            <CheckCircle2 className="w-3.5 h-3.5" />
            {successMsg}
          </span>
        )}

        <button
          onClick={handleSaveDraft}
          disabled={saving || deploying}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium rounded-full border border-border/40 bg-card/60 backdrop-blur-md hover:bg-muted/50 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100"
        >
          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
          Save
        </button>

        {status === "active" ? (
          <button
            onClick={handlePause}
            disabled={saving || deploying}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 transition-colors disabled:opacity-50"
          >
            <Pause className="w-3.5 h-3.5" />
            Pause
          </button>
        ) : (
          <button
            onClick={handleDeploy}
            disabled={deployDisabled}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium rounded-full gradient-accent-bg text-white shadow-sm hover:scale-[1.02] transition-transform disabled:opacity-50"
          >
            {deploying ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Rocket className="w-3.5 h-3.5" />}
            Deploy
          </button>
        )}
      </div>
    </div>
  );

  // ── Widget layout ──────────────────────────────────────────────────────
  if (!isWhatsApp) {
    return (
      <div className="space-y-4">
        {pageHeader}
        <div className="flex gap-4 stagger-enter" style={{ minHeight: "calc(100vh - 360px)" }}>
          <div style={{ '--stagger': 0 } as React.CSSProperties} className="flex-1 min-w-0">
            <ConfigPanel
              config={widgetConfig}
              onChange={setWidgetConfig}
              clientWebsite={clientWebsite}
              onClientWebsiteChange={setClientWebsite}
              allowedOrigins={allowedOrigins}
              onAllowedOriginsChange={setAllowedOrigins}
              embedCode={status === "active" ? embedCode : null}
            />
          </div>
          <div style={{ '--stagger': 1 } as React.CSSProperties} className="flex-1 min-w-0">
            <PreviewPanel
              config={widgetConfig}
              token={token}
              agentId={agentId}
              clientWebsite={clientWebsite}
              screenshotUrl={screenshotUrl}
              onScreenshotChange={setScreenshotUrl}
            />
          </div>
        </div>
      </div>
    );
  }

  // ── WhatsApp layout ────────────────────────────────────────────────────
  return (
    <div className="space-y-0">
      {pageHeader}

      {/* WhatsApp sub-navigation */}
      <div className="flex items-center gap-1 border-b border-border/40 mb-6 animate-in fade-in slide-in-from-bottom-1 duration-300 delay-100 fill-mode-both">
        {WA_TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = waTab === tab.id;
          const needsChannel = tab.id !== "settings" && !channel;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => !needsChannel && switchWaTab(tab.id)}
              disabled={needsChannel}
              className={cn(
                "relative flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-all duration-200",
                isActive
                  ? "border-foreground text-foreground"
                  : needsChannel
                    ? "border-transparent text-muted-foreground/30 cursor-not-allowed"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
              )}
            >
              <Icon className={cn("w-4 h-4 transition-transform duration-200", isActive && "scale-110")} />
              {tab.label}
            </button>
          );
        })}

        {/* Setup progress — inline in the tab bar */}
        <div className="ml-auto flex items-center gap-2 pb-1">
          <div className="flex items-center gap-1">
            {setupSteps.map((step, i) => (
              <div
                key={i}
                title={step.label}
                className={cn(
                  "w-2 h-2 rounded-full transition-all duration-300",
                  step.done
                    ? "bg-emerald-500 scale-110"
                    : "bg-neutral-200 dark:bg-neutral-700 scale-100"
                )}
              />
            ))}
          </div>
          <span className="text-[10px] text-muted-foreground font-medium">
            {completedSteps}/{setupSteps.length}
          </span>
        </div>
      </div>

      {/* Tab content */}
      <div
        key={waTab}
        className={cn(
          "transition-all duration-200 ease-out",
          tabTransition
            ? "opacity-0 translate-y-1"
            : "opacity-100 translate-y-0"
        )}
      >
      {waTab === "settings" && (
        <div className="space-y-5">
          {/* Live banner */}
          {status === "active" && (
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200/40 dark:border-emerald-800/30 animate-in fade-in slide-in-from-top-2 duration-300 fill-mode-both">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400 flex-1">
                Campaign is live and receiving messages
              </p>
              {webhookUrl && (
                <button
                  onClick={copyWebhookUrl}
                  className="shrink-0 flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400 hover:underline"
                >
                  {webhookCopied ? <><Check className="w-3 h-3" /> Copied</> : <><Copy className="w-3 h-3" /> Copy webhook URL</>}
                </button>
              )}
            </div>
          )}

          <WhatsAppConfigPanel
            config={waConfig}
            onChange={setWaConfig}
            rateLimitRpm={rateLimitRpm}
            onRateLimitChange={setRateLimitRpm}
            webhookUrl={webhookUrl}
            verifyTokenDisplay={waConfig.verifyToken ?? ""}
            approvedTemplates={approvedTemplates}
            campaignId={campaign.id}
          />

          {/* Connection status — inline */}
          {channel && (
            <div className="flex items-center gap-4 py-2 text-xs text-muted-foreground animate-in fade-in duration-300 delay-150 fill-mode-both">
              <span className="flex items-center gap-1.5">
                <span className={cn("w-1.5 h-1.5 rounded-full", channel.is_enabled ? "bg-emerald-500" : "bg-neutral-300")} />
                Channel {channel.is_enabled ? "Active" : "Paused"}
              </span>
              <span className="flex items-center gap-1.5">
                <span className={cn("w-1.5 h-1.5 rounded-full", webhookUrl ? "bg-emerald-500" : "bg-neutral-300")} />
                Webhook {webhookUrl ? "Configured" : "Pending"}
              </span>
              <span className="flex items-center gap-1.5">
                <span className={cn("w-1.5 h-1.5 rounded-full", status === "active" ? "bg-emerald-500" : "bg-neutral-300")} />
                Inbound {status === "active" ? "Receiving" : "Stopped"}
              </span>
              <span className="ml-auto font-mono text-[10px] text-muted-foreground/60">
                {channel.id.slice(0, 8)}
              </span>
            </div>
          )}
        </div>
      )}

      {waTab === "templates" && channel && (
        <TemplatesTab
          agentId={agentId}
          channelId={channel.id}
          hasBusinessAccountId={hasWaba}
        />
      )}

      {waTab === "templates" && !channel && (
        <EmptyTabState
          icon={FileText}
          title="Save Settings First"
          description="Configure and save your WhatsApp credentials in the Settings tab to unlock template management."
          action="Go to Settings"
          onAction={() => setWaTab("settings")}
        />
      )}

      {waTab === "contacts" && channel && (
        <ContactsTab
          campaignId={campaign.id}
          channelId={channel.id}
        />
      )}

      {waTab === "contacts" && !channel && (
        <EmptyTabState
          icon={Users}
          title="Deploy First"
          description="Deploy your campaign to start managing contacts. You'll be able to import CSV files and add contacts manually."
          action="Go to Settings"
          onAction={() => setWaTab("settings")}
        />
      )}

      {waTab === "sends" && channel && (
        <SendsTab
          agentId={agentId}
          channelId={channel.id}
          campaignId={campaign.id}
        />
      )}

      {waTab === "sends" && !channel && (
        <EmptyTabState
          icon={Send}
          title="Deploy First"
          description="Deploy your campaign, create templates, and import contacts before sending outbound messages."
          action="Go to Settings"
          onAction={() => setWaTab("settings")}
        />
      )}

      {waTab === "sequences" && channel && (
        <SequencesTab campaignId={campaign.id} channelId={channel.id} />
      )}

      {waTab === "sequences" && !channel && (
        <EmptyTabState
          icon={Zap}
          title="Deploy First"
          description="Deploy your campaign before creating follow-up sequences."
          action="Go to Settings"
          onAction={() => setWaTab("settings")}
        />
      )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

/** Empty state for tabs that require a channel */
function EmptyTabState({
  icon: Icon,
  title,
  description,
  action,
  onAction,
}: {
  icon: typeof FileText;
  title: string;
  description: string;
  action: string;
  onAction: () => void;
}) {
  return (
    <div className="flex items-center justify-center py-20 animate-in fade-in duration-300 fill-mode-both">
      <div className="text-center max-w-xs animate-in fade-in zoom-in-95 slide-in-from-bottom-3 duration-400 fill-mode-both">
        <div className="w-14 h-14 rounded-2xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mx-auto mb-4">
          <Icon className="w-7 h-7 text-muted-foreground/40" />
        </div>
        <p className="text-sm font-medium text-foreground mb-1">{title}</p>
        <p className="text-xs text-muted-foreground mb-4">{description}</p>
        <button
          type="button"
          onClick={onAction}
          className="px-4 py-2 text-xs font-medium rounded-full gradient-accent-bg text-white shadow-sm hover:scale-[1.02] active:scale-[0.98] transition-transform"
        >
          {action}
        </button>
      </div>
    </div>
  );
}
