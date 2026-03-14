"use client";

import { useState, useCallback, useEffect } from "react";
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
  description: string;
}[] = [
  { id: "settings", label: "Settings", icon: Settings2, description: "API credentials & behavior" },
  { id: "templates", label: "Templates", icon: FileText, description: "Message templates" },
  { id: "contacts", label: "Contacts", icon: Users, description: "Manage audience" },
  { id: "sends", label: "Sends", icon: Send, description: "Outbound campaigns" },
  { id: "sequences", label: "Sequences", icon: Zap, description: "Drip campaigns" },
];

const gradientBorderStyle: React.CSSProperties = {
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

  const agentId = campaign.agent_id;
  const token = channel?.token ?? "";

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
    { label: "API Credentials", done: hasCredentials, description: "Phone ID, access token, verify token" },
    { label: "Business Account", done: hasWaba, description: "WABA ID for templates" },
    { label: "Channel Created", done: !!channel, description: "Save to create webhook" },
    { label: "Deployed", done: status === "active", description: "Go live to receive messages" },
  ];
  const completedSteps = setupSteps.filter((s) => s.done).length;

  // ── Save / Deploy / Pause logic (unchanged) ────────────────────────────

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

  // ── Widget layout (unchanged) ──────────────────────────────────────────
  if (!isWhatsApp) {
    return (
      <div className="flex flex-col h-screen">
        <TopBar
          campaign={campaign}
          agentData={agentData}
          status={status}
          isWhatsApp={false}
          error={error}
          successMsg={successMsg}
          saving={saving}
          deploying={deploying}
          deployDisabled={deployDisabled}
          backUrl={backUrl}
          onBack={() => router.push(backUrl)}
          onSave={handleSaveDraft}
          onDeploy={handleDeploy}
          onPause={handlePause}
        />
        <div className="flex flex-1 gap-4 px-5 pb-5 pt-2 overflow-hidden">
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
        </div>
      </div>
    );
  }

  // ── WhatsApp layout ─────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-screen bg-white dark:bg-[#0f0f0f]">
      <TopBar
        campaign={campaign}
        agentData={agentData}
        status={status}
        isWhatsApp
        error={error}
        successMsg={successMsg}
        saving={saving}
        deploying={deploying}
        deployDisabled={deployDisabled}
        backUrl={backUrl}
        onBack={() => router.push(backUrl)}
        onSave={handleSaveDraft}
        onDeploy={handleDeploy}
        onPause={handlePause}
      />

      <div className="flex flex-1 overflow-hidden">
        {/* ── Left sidebar ─────────────────────────────────────── */}
        <div className="w-[220px] shrink-0 border-r border-neutral-200/60 dark:border-neutral-800/60 bg-neutral-50/50 dark:bg-neutral-950/50 flex flex-col">
          <nav className="p-2.5 space-y-0.5">
            {WA_TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = waTab === tab.id;
              const needsChannel = tab.id !== "settings" && !channel;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => !needsChannel && setWaTab(tab.id)}
                  disabled={needsChannel}
                  className={cn(
                    "w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-all",
                    isActive
                      ? "bg-white dark:bg-neutral-800/80 text-foreground shadow-[0_1px_3px_rgba(0,0,0,0.06)]"
                      : needsChannel
                        ? "text-muted-foreground/30 cursor-not-allowed"
                        : "text-muted-foreground hover:text-foreground hover:bg-white/60 dark:hover:bg-neutral-800/40"
                  )}
                >
                  <Icon className={cn("w-4 h-4 shrink-0", isActive ? "text-foreground" : "")} />
                  <span className="text-[13px] font-medium">{tab.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Setup progress — compact */}
          <div className="mt-auto px-3 pb-3">
            <div className="space-y-2.5">
              <div className="flex items-center justify-between px-1">
                <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Setup</span>
                <span className="text-[10px] font-semibold text-foreground">{completedSteps}/{setupSteps.length}</span>
              </div>
              <div className="h-1 rounded-full bg-neutral-200/70 dark:bg-neutral-800 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#FF8C00] to-[#9D50BB] transition-all duration-500"
                  style={{ width: `${(completedSteps / setupSteps.length) * 100}%` }}
                />
              </div>
              <div className="space-y-1">
                {setupSteps.map((step, i) => (
                  <div key={i} className="flex items-center gap-1.5 px-1">
                    {step.done ? (
                      <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
                    ) : (
                      <Circle className="w-3 h-3 text-neutral-300 dark:text-neutral-600 shrink-0" />
                    )}
                    <span className={cn(
                      "text-[10px]",
                      step.done ? "text-muted-foreground line-through" : "text-muted-foreground"
                    )}>
                      {step.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── Main content ─────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto">
          {/* ═══ SETTINGS TAB ═══ */}
          {waTab === "settings" && (
            <div className="max-w-3xl mx-auto px-8 py-6 space-y-6">
              {/* Live banner */}
              {status === "active" && (
                <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200/40 dark:border-emerald-800/30">
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

              {/* Connection status — inline, not a sidebar card */}
              {channel && (
                <div className="flex items-center gap-4 px-1 py-2 text-xs text-muted-foreground">
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

          {/* ═══ TEMPLATES TAB ═══ */}
          {waTab === "templates" && channel && (
            <div className="max-w-3xl mx-auto px-8 py-6">
              <TemplatesTab
                agentId={agentId}
                channelId={channel.id}
                hasBusinessAccountId={hasWaba}
              />
            </div>
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

          {/* ═══ CONTACTS TAB ═══ */}
          {waTab === "contacts" && channel && (
            <div className="max-w-3xl mx-auto px-8 py-6">
              <ContactsTab
                campaignId={campaign.id}
                channelId={channel.id}
              />
            </div>
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

          {/* ═══ SENDS TAB ═══ */}
          {waTab === "sends" && channel && (
            <div className="max-w-3xl mx-auto px-8 py-6">
              <SendsTab
                agentId={agentId}
                channelId={channel.id}
                campaignId={campaign.id}
              />
            </div>
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

          {/* ═══ SEQUENCES TAB ═══ */}
          {waTab === "sequences" && channel && (
            <div className="max-w-3xl mx-auto px-8 py-6">
              <SequencesTab campaignId={campaign.id} channelId={channel.id} />
            </div>
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
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

/** Shared top bar for both widget and WhatsApp */
function TopBar({
  campaign,
  agentData,
  status,
  isWhatsApp,
  error,
  successMsg,
  saving,
  deploying,
  deployDisabled,
  onBack,
  onSave,
  onDeploy,
  onPause,
}: {
  campaign: CampaignData;
  agentData: { id: string; name: string; personality: unknown } | null | undefined;
  status: string;
  isWhatsApp: boolean;
  error: string | null;
  successMsg?: string | null;
  saving: boolean;
  deploying: boolean;
  deployDisabled: boolean;
  backUrl: string;
  onBack: () => void;
  onSave: () => void;
  onDeploy: () => void;
  onPause: () => void;
}) {
  return (
    <div className="flex items-center justify-between px-5 py-3 border-b border-neutral-200/50 dark:border-neutral-800/50 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-md shrink-0">
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="p-2 rounded-full border border-border/40 bg-card/60 backdrop-blur-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-sm font-semibold text-foreground">{campaign.name}</h1>
          <p className="text-xs text-muted-foreground">
            {agentData?.name ?? "Unknown agent"}
            {campaign.clients?.name
              ? ` \u2022 ${campaign.clients.name}`
              : campaign.client_name
                ? ` \u2022 ${campaign.client_name}`
                : null}
          </p>
        </div>

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

      <div className="flex items-center gap-2">
        {error && <span className="text-xs text-destructive mr-2">{error}</span>}
        {successMsg && (
          <span className="text-xs text-emerald-600 dark:text-emerald-400 mr-2 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            {successMsg}
          </span>
        )}

        <button
          onClick={onSave}
          disabled={saving || deploying}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium rounded-full border border-border/40 bg-card/60 backdrop-blur-md hover:bg-muted/50 transition-colors disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
          Save
        </button>

        {status === "active" ? (
          <button
            onClick={onPause}
            disabled={saving || deploying}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 transition-colors disabled:opacity-50"
          >
            <Pause className="w-3.5 h-3.5" />
            Pause
          </button>
        ) : (
          <button
            onClick={onDeploy}
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
}

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
    <div className="flex items-center justify-center h-full">
      <div className="text-center max-w-xs">
        <div className="w-14 h-14 rounded-2xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mx-auto mb-4">
          <Icon className="w-7 h-7 text-muted-foreground/40" />
        </div>
        <p className="text-sm font-medium text-foreground mb-1">{title}</p>
        <p className="text-xs text-muted-foreground mb-4">{description}</p>
        <button
          type="button"
          onClick={onAction}
          className="px-4 py-2 text-xs font-medium rounded-full gradient-accent-bg text-white shadow-sm hover:scale-[1.02] transition-transform"
        >
          {action}
        </button>
      </div>
    </div>
  );
}
