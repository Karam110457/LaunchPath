"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Copy, Check, Globe, MessageSquare, Pause, Play } from "lucide-react";
import { usePortal } from "@/contexts/PortalContext";

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

  const embedCode = widgetChannel
    ? `<script src="${appOrigin}/widget.js" data-channel-id="${widgetChannel.id}"></script>`
    : null;

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
    <div className="p-6 lg:p-8 max-w-4xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300 fill-mode-both">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href={`${basePath}/campaigns`}
          className="p-2 rounded-xl border border-border/40 bg-card/60 backdrop-blur-md hover:bg-muted/50 transition-colors duration-150"
        >
          <ArrowLeft className="size-4" />
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-semibold tracking-tight truncate">{campaign.name}</h1>
          {campaign.agent_name && (
            <p className="text-sm text-muted-foreground">Agent: {campaign.agent_name}</p>
          )}
        </div>
        <span
          className={`text-xs px-2.5 py-1 rounded-full font-medium ${
            status === "active"
              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
              : status === "paused"
              ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
              : "bg-zinc-500/10 text-zinc-500"
          }`}
        >
          {status}
        </span>
        {isAdmin && status !== "draft" && (
          <button
            onClick={toggleStatus}
            disabled={isUpdating}
            className={`inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-medium rounded-full transition-colors duration-150 disabled:opacity-50 ${
              status === "active"
                ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20"
                : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20"
            }`}
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
      <nav className="flex items-center p-1 rounded-full border border-border/40 bg-card/60 backdrop-blur-md w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-5 py-2 text-sm font-medium rounded-full transition-all duration-150 ${
              activeTab === tab.key
                ? "bg-foreground text-background shadow-md"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {/* Tab Content */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div className="rounded-2xl border border-border/40 bg-card/60 backdrop-blur-sm p-4">
              <p className="text-xs text-muted-foreground font-medium">Status</p>
              <p className="text-lg font-bold capitalize">{status}</p>
            </div>
            <div className="rounded-2xl border border-border/40 bg-card/60 backdrop-blur-sm p-4">
              <p className="text-xs text-muted-foreground font-medium">Conversations</p>
              <p className="text-lg font-bold">{conversationCount}</p>
            </div>
            <div className="rounded-2xl border border-border/40 bg-card/60 backdrop-blur-sm p-4">
              <p className="text-xs text-muted-foreground font-medium">Widget</p>
              <p className="text-lg font-bold">
                {widgetChannel?.is_enabled ? "Live" : "Offline"}
              </p>
            </div>
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

      {activeTab === "widget" && (
        <div className="space-y-5">
          {!widgetChannel ? (
            <p className="text-sm text-muted-foreground">
              No widget channel configured for this campaign yet.
            </p>
          ) : (
            <>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Welcome Message</label>
                  <textarea
                    value={(config.welcomeMessage as string) ?? ""}
                    onChange={(e) => setConfig({ ...config, welcomeMessage: e.target.value })}
                    disabled={!isAdmin}
                    className="w-full px-4 py-2.5 text-sm rounded-xl border border-border/40 bg-card/60 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:opacity-60 resize-none transition-colors duration-150"
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Primary Color</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={(config.primaryColor as string) ?? "#6366f1"}
                      onChange={(e) => setConfig({ ...config, primaryColor: e.target.value })}
                      disabled={!isAdmin}
                      className="size-10 rounded-lg border cursor-pointer disabled:opacity-60"
                    />
                    <span className="text-sm text-muted-foreground">
                      {(config.primaryColor as string) ?? "#6366f1"}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Agent Name</label>
                  <input
                    type="text"
                    value={(config.agentName as string) ?? ""}
                    onChange={(e) => setConfig({ ...config, agentName: e.target.value })}
                    disabled={!isAdmin}
                    className="w-full px-4 py-2.5 text-sm rounded-xl border border-border/40 bg-card/60 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:opacity-60 transition-colors duration-150"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Position</label>
                  <div className="flex gap-2">
                    {["right", "left"].map((pos) => (
                      <button
                        key={pos}
                        onClick={() => isAdmin && setConfig({ ...config, position: pos })}
                        disabled={!isAdmin}
                        className={`px-4 py-2 text-sm rounded-full border transition-colors duration-150 ${
                          (config.position ?? "right") === pos
                            ? "bg-foreground text-background shadow-md border-transparent"
                            : "border-border/40 hover:bg-muted/50"
                        } disabled:opacity-60`}
                      >
                        {pos.charAt(0).toUpperCase() + pos.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {isAdmin && (
                <button
                  onClick={handleSaveConfig}
                  disabled={isSaving}
                  className="px-6 py-2.5 text-sm font-medium rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors duration-150 disabled:opacity-50 shadow-sm"
                >
                  {isSaving ? "Saving..." : "Save Changes"}
                </button>
              )}
            </>
          )}
        </div>
      )}

      {activeTab === "deploy" && (
        <div className="space-y-5">
          {!widgetChannel ? (
            <p className="text-sm text-muted-foreground">
              No widget channel to deploy yet.
            </p>
          ) : (
            <>
              <div className="flex items-center gap-3">
                <Globe className="size-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">
                    Widget is {widgetChannel.is_enabled ? "deployed" : "not deployed"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {widgetChannel.is_enabled
                      ? "The widget is live and accepting conversations."
                      : "Deploy the campaign to make the widget live."}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-semibold">Embed Code</h3>
                <p className="text-xs text-muted-foreground">
                  Add this snippet before the closing &lt;/body&gt; tag on your website.
                </p>
                <div className="relative">
                  <pre className="rounded-xl bg-muted/50 border border-border/30 p-4 text-xs overflow-x-auto pr-12 font-mono">
                    {embedCode}
                  </pre>
                  <button
                    onClick={copyEmbed}
                    className="absolute top-3 right-3 p-1.5 rounded-md hover:bg-background/80 transition-colors"
                  >
                    {copied ? (
                      <Check className="size-4 text-emerald-500" />
                    ) : (
                      <Copy className="size-4 text-muted-foreground" />
                    )}
                  </button>
                </div>
              </div>

              {widgetChannel.allowed_origins.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold">Allowed Origins</h3>
                  <div className="flex flex-wrap gap-2">
                    {widgetChannel.allowed_origins.map((origin, i) => (
                      <span key={i} className="px-2.5 py-1 text-xs rounded-full bg-muted font-mono">
                        {origin}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
