"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Copy,
  Check,
  Globe,
  MessageSquare,
  Pause,
  Play,
  Palette,
  MousePointer2,
  Settings2,
  Sparkles,
  Plus,
  X,
} from "lucide-react";
import { usePortal } from "@/contexts/PortalContext";
import { cn } from "@/lib/utils";

interface PortalCampaignDetailProps {
  campaign: {
    id: string;
    name: string;
    status: string;
    agent_name: string | null;
  };
  widgetChannel: {
    id: string;
    is_enabled: boolean;
    config: Record<string, unknown>;
    allowed_origins: string[];
  } | null;
  conversationCount: number;
  appOrigin: string;
  role: "admin" | "viewer";
}

const INPUT_CLASS =
  "w-full rounded-xl border border-neutral-200/60 dark:border-[#2A2A2A] bg-white dark:bg-[#151515] px-4 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-colors duration-150 disabled:opacity-60";

function SectionCard({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-[32px] border border-black/5 dark:border-[#2A2A2A] bg-[#f8f9fa] dark:bg-[#1E1E1E]/80 p-6 space-y-5">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Icon className="size-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold">{title}</h3>
        </div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      {children}
    </div>
  );
}

function FieldGroup({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium">{label}</label>
      {children}
      {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

function TogglePills({
  options,
  value,
  onChange,
  disabled,
}: {
  options: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex gap-2">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => !disabled && onChange(opt.value)}
          disabled={disabled}
          className={cn(
            "px-4 py-2 text-sm rounded-full border transition-colors duration-150 disabled:opacity-60",
            value === opt.value
              ? "bg-foreground text-background shadow-md border-transparent"
              : "border-border/40 hover:bg-muted/50"
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

function Toggle({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={() => !disabled && onChange(!checked)}
      disabled={disabled}
      className={cn(
        "relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-200 disabled:opacity-60",
        checked ? "gradient-accent-bg" : "bg-muted-foreground/30"
      )}
    >
      <span
        className={cn(
          "inline-block size-3.5 transform rounded-full bg-white transition-transform duration-200",
          checked ? "translate-x-[18px]" : "translate-x-[3px]"
        )}
      />
    </button>
  );
}

export function PortalCampaignDetail({
  campaign,
  widgetChannel,
  conversationCount,
  appOrigin,
  role,
}: PortalCampaignDetailProps) {
  const { basePath } = usePortal();
  const router = useRouter();
  const isAdmin = role === "admin";
  const [status, setStatus] = useState(campaign.status);
  const [isUpdating, setIsUpdating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "widget" | "deploy">("overview");

  // Widget config state (for admin editing)
  const [config, setConfig] = useState(widgetChannel?.config ?? {});
  const [isSaving, setIsSaving] = useState(false);

  const starters = (config.conversationStarters as string[]) ?? [];

  const embedCode = widgetChannel
    ? `<script src="${appOrigin}/widget.js" data-channel-id="${widgetChannel.id}"></script>`
    : null;

  function updateConfig(key: string, value: unknown) {
    setConfig({ ...config, [key]: value });
  }

  function addStarter() {
    if (starters.length >= 4) return;
    updateConfig("conversationStarters", [...starters, ""]);
  }

  function updateStarter(index: number, value: string) {
    const updated = [...starters];
    updated[index] = value;
    updateConfig("conversationStarters", updated);
  }

  function removeStarter(index: number) {
    updateConfig("conversationStarters", starters.filter((_, i) => i !== index));
  }

  async function toggleStatus() {
    const newStatus = status === "active" ? "paused" : "active";
    setIsUpdating(true);
    try {
      const res = await fetch(`/api/portal/campaigns/${campaign.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setStatus(newStatus);
        router.refresh();
      }
    } finally {
      setIsUpdating(false);
    }
  }

  async function handleSaveConfig() {
    if (!widgetChannel) return;
    setIsSaving(true);
    try {
      await fetch(`/api/portal/campaigns/${campaign.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channel_id: widgetChannel.id,
          channel_config: config,
        }),
      });
      router.refresh();
    } finally {
      setIsSaving(false);
    }
  }

  function copyEmbed() {
    if (!embedCode) return;
    navigator.clipboard.writeText(embedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const tabs = [
    { key: "overview" as const, label: "Overview" },
    { key: "widget" as const, label: "Widget Config" },
    { key: "deploy" as const, label: "Deploy" },
  ];

  return (
    <div className="w-full max-w-7xl mx-auto px-6 py-8 space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300 fill-mode-both">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href={`${basePath}/campaigns`}
          className="p-2.5 rounded-full border border-border/40 bg-card/60 backdrop-blur-md hover:bg-muted/50 transition-colors duration-150"
        >
          <ArrowLeft className="size-4" />
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight truncate">{campaign.name}</h1>
          {campaign.agent_name && (
            <p className="text-sm text-muted-foreground">Agent: {campaign.agent_name}</p>
          )}
        </div>
        <span
          className={cn(
            "text-xs px-2.5 py-1 rounded-full font-medium",
            status === "active"
              ? "bg-gradient-to-r from-[#FF8C00]/10 to-[#9D50BB]/10 text-neutral-900 dark:text-neutral-100 border border-[#FF8C00]/20"
              : status === "paused"
              ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
              : "bg-zinc-500/10 text-zinc-500"
          )}
        >
          {status}
        </span>
        {isAdmin && status !== "draft" && (
          <button
            onClick={toggleStatus}
            disabled={isUpdating}
            className={cn(
              "inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-medium rounded-full transition-colors duration-150 disabled:opacity-50",
              status === "active"
                ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20"
                : "gradient-accent-bg text-white hover:opacity-90"
            )}
          >
            {status === "active" ? (
              <><Pause className="size-3.5" /> Pause</>
            ) : (
              <><Play className="size-3.5" /> Activate</>
            )}
          </button>
        )}
      </div>

      {/* Tabs */}
      <nav className="flex items-center p-1.5 rounded-full border border-border/40 bg-card/60 backdrop-blur-md w-fit shadow-sm">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              "px-5 py-2 text-sm font-medium rounded-full transition-all duration-150",
              activeTab === tab.key
                ? "bg-foreground text-background shadow-md"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            )}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {/* ═══════ OVERVIEW TAB ═══════ */}
      {activeTab === "overview" && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 stagger-enter">
            {[
              { label: "Status", value: status, capitalize: true },
              { label: "Conversations", value: String(conversationCount) },
              { label: "Widget", value: widgetChannel?.is_enabled ? "Live" : "Offline" },
            ].map((stat, i) => (
              <div
                key={stat.label}
                style={{ "--stagger": i } as React.CSSProperties}
                className="rounded-[32px] border border-black/5 dark:border-[#2A2A2A] bg-[#f8f9fa] dark:bg-[#1E1E1E]/80 p-5"
              >
                <p className="text-xs text-muted-foreground font-medium">{stat.label}</p>
                <p className={cn("text-xl font-bold mt-1", stat.capitalize && "capitalize")}>{stat.value}</p>
              </div>
            ))}
          </div>

          <Link
            href={`${basePath}/conversations?campaignId=${campaign.id}`}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium rounded-full border border-border/40 bg-card/60 backdrop-blur-md hover:bg-muted/50 transition-colors duration-150"
          >
            <MessageSquare className="size-4" />
            View Conversations
          </Link>
        </div>
      )}

      {/* ═══════ WIDGET CONFIG TAB ═══════ */}
      {activeTab === "widget" && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {!widgetChannel ? (
            <div className="text-center py-20 px-6 rounded-[32px] border border-dashed border-border/60 bg-card/30">
              <Settings2 className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
              <h3 className="text-lg font-medium">No widget channel configured</h3>
              <p className="text-muted-foreground text-sm mt-1 max-w-sm mx-auto">
                Contact your agency to set up a website widget for this campaign.
              </p>
            </div>
          ) : (
            <>
              {/* Appearance */}
              <SectionCard
                icon={Palette}
                title="Appearance"
                description="Control how the widget looks on your website."
              >
                <FieldGroup label="Primary Color" hint="The main color for the header, buttons, and user messages.">
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={(config.primaryColor as string) ?? "#6366f1"}
                      onChange={(e) => updateConfig("primaryColor", e.target.value)}
                      disabled={!isAdmin}
                      className="size-10 rounded-xl border border-neutral-200/60 dark:border-[#2A2A2A] cursor-pointer shadow-sm disabled:opacity-60"
                    />
                    <span className="text-sm text-muted-foreground font-mono">
                      {(config.primaryColor as string) ?? "#6366f1"}
                    </span>
                  </div>
                </FieldGroup>

                <FieldGroup label="Theme">
                  <TogglePills
                    options={[
                      { value: "light", label: "Light" },
                      { value: "dark", label: "Dark" },
                    ]}
                    value={(config.theme as string) ?? "light"}
                    onChange={(v) => updateConfig("theme", v)}
                    disabled={!isAdmin}
                  />
                </FieldGroup>

                <FieldGroup label="Corner Style" hint="Rounded gives a modern look. Sharp gives a more structured feel.">
                  <TogglePills
                    options={[
                      { value: "rounded", label: "Rounded" },
                      { value: "sharp", label: "Sharp" },
                    ]}
                    value={(config.borderRadius as string) ?? "rounded"}
                    onChange={(v) => updateConfig("borderRadius", v)}
                    disabled={!isAdmin}
                  />
                </FieldGroup>

                <FieldGroup label="Widget Size" hint="Controls the overall size of the chat widget and button.">
                  <TogglePills
                    options={[
                      { value: "compact", label: "Compact" },
                      { value: "default", label: "Default" },
                      { value: "large", label: "Large" },
                    ]}
                    value={(config.widgetSize as string) ?? "default"}
                    onChange={(v) => updateConfig("widgetSize", v)}
                    disabled={!isAdmin}
                  />
                </FieldGroup>

                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium">Show &ldquo;Powered by&rdquo;</label>
                    <p className="text-[11px] text-muted-foreground">
                      Display LaunchPath branding in the widget footer.
                    </p>
                  </div>
                  <Toggle
                    checked={(config.showBranding as boolean) !== false}
                    onChange={(v) => updateConfig("showBranding", v)}
                    disabled={!isAdmin}
                  />
                </div>
              </SectionCard>

              {/* Content & Identity */}
              <SectionCard
                icon={Sparkles}
                title="Content & Identity"
                description="Set up the agent's name, avatar, and messages visitors see."
              >
                <FieldGroup label="Display Name" hint="Shown at the top of the chat window.">
                  <input
                    type="text"
                    value={(config.agentName as string) ?? ""}
                    onChange={(e) => updateConfig("agentName", e.target.value)}
                    disabled={!isAdmin}
                    placeholder="AI Assistant"
                    className={INPUT_CLASS}
                  />
                </FieldGroup>

                <FieldGroup label="Chat Avatar" hint="An image URL or emoji shown next to the name.">
                  <input
                    type="text"
                    value={(config.agentAvatar as string) ?? ""}
                    onChange={(e) => updateConfig("agentAvatar", e.target.value)}
                    disabled={!isAdmin}
                    placeholder="https://... or emoji like 🤖"
                    className={INPUT_CLASS}
                  />
                </FieldGroup>

                <FieldGroup label="Welcome Message" hint="The first message visitors see when they open the chat.">
                  <textarea
                    value={(config.welcomeMessage as string) ?? ""}
                    onChange={(e) => updateConfig("welcomeMessage", e.target.value)}
                    disabled={!isAdmin}
                    placeholder="Hi! How can I help you today?"
                    rows={3}
                    className={cn(INPUT_CLASS, "resize-none")}
                  />
                </FieldGroup>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Quick Reply Buttons</label>
                  <p className="text-[11px] text-muted-foreground">
                    Suggested messages visitors can click to start a conversation.
                  </p>
                  <div className="space-y-2">
                    {starters.map((s, i) => (
                      <div key={i} className="flex gap-2">
                        <input
                          value={s}
                          onChange={(e) => updateStarter(i, e.target.value)}
                          disabled={!isAdmin}
                          placeholder={`e.g. "What services do you offer?"`}
                          className={cn(INPUT_CLASS, "flex-1")}
                        />
                        {isAdmin && (
                          <button
                            type="button"
                            onClick={() => removeStarter(i)}
                            className="p-2.5 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors duration-150"
                          >
                            <X className="size-3.5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  {isAdmin && starters.length < 4 && (
                    <button
                      type="button"
                      onClick={addStarter}
                      className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors duration-150"
                    >
                      <Plus className="size-3" />
                      Add quick reply
                    </button>
                  )}
                </div>

                <FieldGroup label="Greeting Message" hint="A small popup that appears next to the chat button. Leave empty to disable.">
                  <textarea
                    value={(config.greetingMessage as string) ?? ""}
                    onChange={(e) => updateConfig("greetingMessage", e.target.value)}
                    disabled={!isAdmin}
                    placeholder="👋 Hi there! Need any help?"
                    rows={2}
                    className={cn(INPUT_CLASS, "resize-none")}
                  />
                </FieldGroup>

                <FieldGroup label="Greeting Delay" hint="Seconds before the greeting popup appears.">
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={0}
                      max={60}
                      value={(config.greetingDelay as number) ?? 3}
                      onChange={(e) => updateConfig("greetingDelay", parseInt(e.target.value) || 0)}
                      disabled={!isAdmin}
                      className={cn(INPUT_CLASS, "w-24")}
                    />
                    <span className="text-xs text-muted-foreground">seconds</span>
                  </div>
                </FieldGroup>
              </SectionCard>

              {/* Button & Position */}
              <SectionCard
                icon={MousePointer2}
                title="Button & Position"
                description="Customize the floating chat button."
              >
                <FieldGroup label="Button Icon" hint="Custom icon for the floating button. Leave empty for default chat bubble.">
                  <input
                    type="text"
                    value={(config.launcherIcon as string) ?? ""}
                    onChange={(e) => updateConfig("launcherIcon", e.target.value)}
                    disabled={!isAdmin}
                    placeholder="https://... or emoji like 💬"
                    className={INPUT_CLASS}
                  />
                </FieldGroup>

                <FieldGroup label="Button Position" hint="Which corner of the screen the chat button appears in.">
                  <TogglePills
                    options={[
                      { value: "right", label: "Bottom Right" },
                      { value: "left", label: "Bottom Left" },
                    ]}
                    value={(config.position as string) ?? "right"}
                    onChange={(v) => updateConfig("position", v)}
                    disabled={!isAdmin}
                  />
                </FieldGroup>
              </SectionCard>

              {/* Save button */}
              {isAdmin && (
                <button
                  onClick={handleSaveConfig}
                  disabled={isSaving}
                  className="px-6 py-2.5 text-sm font-medium rounded-full gradient-accent-bg text-white hover:scale-[1.02] transition-transform duration-150 disabled:opacity-50 shadow-sm"
                >
                  {isSaving ? "Saving..." : "Save Changes"}
                </button>
              )}
            </>
          )}
        </div>
      )}

      {/* ═══════ DEPLOY TAB ═══════ */}
      {activeTab === "deploy" && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {!widgetChannel ? (
            <div className="text-center py-20 px-6 rounded-[32px] border border-dashed border-border/60 bg-card/30">
              <Globe className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
              <h3 className="text-lg font-medium">No widget to deploy</h3>
              <p className="text-muted-foreground text-sm mt-1 max-w-sm mx-auto">
                Contact your agency to set up a website widget for this campaign.
              </p>
            </div>
          ) : (
            <>
              {/* Status banner */}
              <div className="rounded-[32px] border border-black/5 dark:border-[#2A2A2A] bg-[#f8f9fa] dark:bg-[#1E1E1E]/80 p-6">
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "size-12 rounded-2xl flex items-center justify-center",
                    widgetChannel.is_enabled
                      ? "bg-gradient-to-br from-[#FF8C00]/15 to-[#9D50BB]/10"
                      : "bg-muted/50"
                  )}>
                    <Globe className={cn(
                      "size-6",
                      widgetChannel.is_enabled ? "text-[#FF8C00]" : "text-muted-foreground"
                    )} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">
                      Widget is {widgetChannel.is_enabled ? "deployed" : "not deployed"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {widgetChannel.is_enabled
                        ? "The widget is live and accepting conversations."
                        : "Deploy the campaign to make the widget live."}
                    </p>
                  </div>
                </div>
              </div>

              {/* Embed Code */}
              <SectionCard
                icon={Settings2}
                title="Embed Code"
                description="Add this snippet before the closing </body> tag on your website."
              >
                <div className="relative">
                  <pre className="rounded-2xl bg-white dark:bg-[#151515] border border-neutral-200/60 dark:border-[#2A2A2A] p-4 text-xs overflow-x-auto pr-14 font-mono shadow-sm">
                    {embedCode}
                  </pre>
                  <button
                    onClick={copyEmbed}
                    className="absolute top-3 right-3 p-2 rounded-xl bg-muted/50 hover:bg-muted transition-colors duration-150"
                  >
                    {copied ? (
                      <Check className="size-4 text-[#FF8C00]" />
                    ) : (
                      <Copy className="size-4 text-muted-foreground" />
                    )}
                  </button>
                </div>
              </SectionCard>

              {/* Allowed Origins */}
              {widgetChannel.allowed_origins.length > 0 && (
                <SectionCard
                  icon={Globe}
                  title="Allowed Origins"
                  description="Only these websites can use the widget."
                >
                  <div className="flex flex-wrap gap-2">
                    {widgetChannel.allowed_origins.map((origin, i) => (
                      <span
                        key={i}
                        className="px-3 py-1.5 text-xs rounded-full bg-white dark:bg-[#151515] border border-neutral-200/60 dark:border-[#2A2A2A] font-mono shadow-sm"
                      >
                        {origin}
                      </span>
                    ))}
                  </div>
                </SectionCard>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
