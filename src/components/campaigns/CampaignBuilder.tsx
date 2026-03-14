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
  Shield,
  Zap,
  Globe,
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

  // ── WhatsApp layout (redesigned) ───────────────────────────────────────
  return (
    <div className="flex flex-col h-screen bg-[#fafafa] dark:bg-[#0a0a0a]">
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
        {/* ── Left sidebar: navigation + setup progress ────────────── */}
        <div className="w-[240px] shrink-0 border-r border-neutral-200/50 dark:border-neutral-800/50 flex flex-col">
          {/* Tab navigation */}
          <nav className="p-3 space-y-1">
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
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all",
                    isActive
                      ? "bg-white dark:bg-neutral-900 shadow-sm border border-neutral-200/60 dark:border-neutral-700/40"
                      : needsChannel
                        ? "text-muted-foreground/40 cursor-not-allowed"
                        : "hover:bg-white/60 dark:hover:bg-neutral-900/40 text-muted-foreground hover:text-foreground"
                  )}
                >
                  <div
                    className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                      isActive
                        ? "gradient-accent-bg"
                        : "bg-neutral-100 dark:bg-neutral-800"
                    )}
                  >
                    <Icon className={cn("w-4 h-4", isActive ? "text-white" : "text-muted-foreground")} />
                  </div>
                  <div className="min-w-0">
                    <p className={cn(
                      "text-xs font-medium",
                      isActive ? "text-foreground" : ""
                    )}>
                      {tab.label}
                    </p>
                    <p className="text-[10px] text-muted-foreground truncate">
                      {tab.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </nav>

          {/* Setup progress */}
          <div className="mt-auto p-4 border-t border-neutral-200/50 dark:border-neutral-800/50">
            <div className="rounded-[20px] bg-white dark:bg-neutral-900 border border-neutral-200/60 dark:border-neutral-700/40 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Setup Progress
                </p>
                <span className="text-[10px] font-semibold text-foreground">
                  {completedSteps}/{setupSteps.length}
                </span>
              </div>

              {/* Progress bar */}
              <div className="h-1.5 rounded-full bg-neutral-100 dark:bg-neutral-800 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#FF8C00] to-[#9D50BB] transition-all duration-500"
                  style={{ width: `${(completedSteps / setupSteps.length) * 100}%` }}
                />
              </div>

              {/* Steps */}
              <div className="space-y-2">
                {setupSteps.map((step, i) => (
                  <div key={i} className="flex items-start gap-2">
                    {step.done ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                    ) : (
                      <Circle className="w-3.5 h-3.5 text-neutral-300 dark:text-neutral-600 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <p className={cn(
                        "text-[11px] font-medium",
                        step.done ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"
                      )}>
                        {step.label}
                      </p>
                      <p className="text-[9px] text-muted-foreground">{step.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── Main content area ────────────────────────────────── */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {/* Tab content */}
          <div className="flex-1 overflow-y-auto">
            {/* ═══ SETTINGS TAB ═══ */}
            {waTab === "settings" && (
              <div className="max-w-4xl mx-auto p-6 space-y-6">
                {/* Quick status banner */}
                {status === "active" && (
                  <div
                    className="rounded-[20px] border-2 border-transparent p-4 flex items-center gap-4 [--card-bg:#f8f9fa] dark:[--card-bg:#1E1E1E]"
                    style={gradientBorderStyle}
                  >
                    <div className="w-10 h-10 rounded-xl gradient-accent-bg flex items-center justify-center shrink-0">
                      <Zap className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground">Campaign is Live</p>
                      <p className="text-xs text-muted-foreground">
                        Your WhatsApp channel is active and receiving messages. Changes are saved automatically.
                      </p>
                    </div>
                    {webhookUrl && (
                      <button
                        onClick={copyWebhookUrl}
                        className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium rounded-full border border-neutral-200/60 dark:border-neutral-700/50 hover:bg-white dark:hover:bg-neutral-800 transition-colors"
                      >
                        {webhookCopied ? (
                          <><Check className="w-3 h-3 text-emerald-500" /> Copied</>
                        ) : (
                          <><Copy className="w-3 h-3" /> Webhook URL</>
                        )}
                      </button>
                    )}
                  </div>
                )}

                {/* Two-column layout: config + guide */}
                <div className="flex gap-6">
                  {/* Config panel */}
                  <div className="flex-1">
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
                  </div>

                  {/* Guide sidebar */}
                  <div className="w-[280px] shrink-0 space-y-4">
                    {/* Getting started guide */}
                    <div className="rounded-[20px] bg-white dark:bg-neutral-900 border border-neutral-200/60 dark:border-neutral-700/40 p-5 space-y-4">
                      <div className="flex items-center gap-2">
                        <Shield className="w-4 h-4 text-muted-foreground" />
                        <h4 className="text-xs font-semibold text-foreground">Getting Started</h4>
                      </div>

                      <div className="space-y-3">
                        <GuideStep
                          number={1}
                          title="Create a Meta App"
                          description="Go to developers.facebook.com and create a Business app with WhatsApp."
                          done={hasCredentials}
                        />
                        <GuideStep
                          number={2}
                          title="Copy your credentials"
                          description="Find your Phone Number ID, WABA ID, and generate a system user token."
                          done={hasCredentials && hasWaba}
                        />
                        <GuideStep
                          number={3}
                          title="Save & configure webhook"
                          description="Save your settings, then paste the webhook URL in your Meta app dashboard."
                          done={!!webhookUrl}
                        />
                        <GuideStep
                          number={4}
                          title="Deploy your campaign"
                          description="Click Deploy to start receiving and responding to WhatsApp messages."
                          done={status === "active"}
                        />
                      </div>
                    </div>

                    {/* Quick stats (when deployed) */}
                    {channel && (
                      <div className="rounded-[20px] bg-white dark:bg-neutral-900 border border-neutral-200/60 dark:border-neutral-700/40 p-5 space-y-3">
                        <h4 className="text-xs font-semibold text-foreground flex items-center gap-2">
                          <Globe className="w-4 h-4 text-muted-foreground" />
                          Connection
                        </h4>
                        <div className="space-y-2">
                          <StatusRow
                            label="Channel"
                            ok
                            detail={channel.is_enabled ? "Active" : "Paused"}
                          />
                          <StatusRow
                            label="Webhook"
                            ok={!!webhookUrl}
                            detail={webhookUrl ? "Configured" : "Pending"}
                          />
                          <StatusRow
                            label="Inbound"
                            ok={status === "active"}
                            detail={status === "active" ? "Receiving" : "Stopped"}
                          />
                        </div>
                        <p className="text-[10px] text-muted-foreground pt-1 border-t border-neutral-200/50 dark:border-neutral-700/50">
                          ID: <code className="font-mono">{channel.id.slice(0, 12)}...</code>
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ═══ TEMPLATES TAB ═══ */}
            {waTab === "templates" && channel && (
              <div className="max-w-4xl mx-auto p-6">
                <div className="rounded-[2rem] bg-white/70 dark:bg-neutral-900/70 backdrop-blur-xl border border-white/60 dark:border-neutral-700/40 shadow-[0_8px_32px_rgba(0,0,0,0.04)] p-6">
                  <TemplatesTab
                    agentId={agentId}
                    channelId={channel.id}
                    hasBusinessAccountId={hasWaba}
                  />
                </div>
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
              <div className="max-w-4xl mx-auto p-6">
                <div className="rounded-[2rem] bg-white/70 dark:bg-neutral-900/70 backdrop-blur-xl border border-white/60 dark:border-neutral-700/40 shadow-[0_8px_32px_rgba(0,0,0,0.04)] p-6">
                  <ContactsTab
                    campaignId={campaign.id}
                    channelId={channel.id}
                  />
                </div>
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
              <div className="max-w-4xl mx-auto p-6">
                <div className="rounded-[2rem] bg-white/70 dark:bg-neutral-900/70 backdrop-blur-xl border border-white/60 dark:border-neutral-700/40 shadow-[0_8px_32px_rgba(0,0,0,0.04)] p-6">
                  <SendsTab
                    agentId={agentId}
                    channelId={channel.id}
                    campaignId={campaign.id}
                  />
                </div>
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
              <div className="max-w-4xl mx-auto p-6">
                <div className="rounded-[2rem] bg-white/70 dark:bg-neutral-900/70 backdrop-blur-xl border border-white/60 dark:border-neutral-700/40 shadow-[0_8px_32px_rgba(0,0,0,0.04)] p-6">
                  <SequencesTab campaignId={campaign.id} channelId={channel.id} />
                </div>
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

/** Small status indicator row */
function StatusRow({ label, ok, detail }: { label: string; ok: boolean; detail: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs font-medium text-foreground">{label}</span>
      <div className="flex items-center gap-1.5">
        <span className="text-[11px] text-muted-foreground">{detail}</span>
        <span className={cn("w-2 h-2 rounded-full shrink-0", ok ? "bg-emerald-500" : "bg-neutral-300 dark:bg-neutral-600")} />
      </div>
    </div>
  );
}

/** Numbered guide step */
function GuideStep({
  number,
  title,
  description,
  done,
}: {
  number: number;
  title: string;
  description: string;
  done: boolean;
}) {
  return (
    <div className="flex items-start gap-2.5">
      <div
        className={cn(
          "w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold mt-0.5",
          done
            ? "gradient-accent-bg text-white"
            : "bg-neutral-100 dark:bg-neutral-800 text-muted-foreground"
        )}
      >
        {done ? <Check className="w-3 h-3" /> : number}
      </div>
      <div>
        <p className={cn("text-[11px] font-medium", done ? "text-foreground" : "text-muted-foreground")}>
          {title}
        </p>
        <p className="text-[10px] text-muted-foreground leading-relaxed">{description}</p>
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
