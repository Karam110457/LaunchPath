"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Copy, Check, Shield, MessageSquare, Settings2, Sliders, Eye, EyeOff } from "lucide-react";
import { Label } from "@/components/ui/label";
import type { WhatsAppConfig } from "@/lib/channels/types";
import { EventsConfigPanel } from "./whatsapp/EventsConfigPanel";

const INPUT_CLASS =
  "w-full rounded-xl border border-neutral-200/60 dark:border-[#2A2A2A] bg-white dark:bg-[#151515] px-3 py-2 text-sm shadow-sm outline-none focus:ring-2 focus:ring-neutral-400/20 focus:border-neutral-400/50 dark:focus:ring-neutral-500/20 dark:focus:border-neutral-500/40 transition-all placeholder:text-muted-foreground/50";

const TEXTAREA_CLASS =
  "w-full rounded-xl border border-neutral-200/60 dark:border-[#2A2A2A] bg-white dark:bg-[#151515] px-3 py-2 text-sm shadow-sm outline-none focus:ring-2 focus:ring-neutral-400/20 focus:border-neutral-400/50 dark:focus:ring-neutral-500/20 dark:focus:border-neutral-500/40 transition-all placeholder:text-muted-foreground/50 resize-none";

interface TemplateSummary {
  id: string;
  name: string;
  language: string;
  status: string;
}

interface WhatsAppConfigPanelProps {
  config: Partial<WhatsAppConfig>;
  onChange: (config: Partial<WhatsAppConfig>) => void;
  rateLimitRpm: string;
  onRateLimitChange: (rpm: string) => void;
  webhookUrl: string | null;
  verifyTokenDisplay: string;
  /** Approved templates for fallback selector */
  approvedTemplates?: TemplateSummary[];
  /** Campaign ID for event subscriptions */
  campaignId?: string;
}

const TABS = [
  { id: "credentials", label: "Credentials", icon: Shield, description: "API keys & tokens" },
  { id: "messaging", label: "Messaging", icon: MessageSquare, description: "Responses & behavior" },
  { id: "deploy", label: "Deploy", icon: Settings2, description: "Webhook & setup" },
  { id: "advanced", label: "Advanced", icon: Sliders, description: "Business hours, voice & vision" },
] as const;

const DAYS = [
  { key: "monday", label: "Mon" },
  { key: "tuesday", label: "Tue" },
  { key: "wednesday", label: "Wed" },
  { key: "thursday", label: "Thu" },
  { key: "friday", label: "Fri" },
  { key: "saturday", label: "Sat" },
  { key: "sunday", label: "Sun" },
] as const;

const TIMEZONES = [
  "UTC",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "Asia/Dubai",
  "Asia/Kolkata",
  "Asia/Singapore",
  "Asia/Tokyo",
  "Australia/Sydney",
  "Pacific/Auckland",
];

type TabId = (typeof TABS)[number]["id"];

/** Inline style for gradient border via background-clip trick */
const gradientBorderStyle: React.CSSProperties = {
  backgroundImage:
    "linear-gradient(var(--card-bg), var(--card-bg)), linear-gradient(135deg, #FF8C00, #9D50BB)",
  backgroundOrigin: "border-box",
  backgroundClip: "padding-box, border-box",
};

function Toggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
        checked ? "gradient-accent-bg" : "bg-muted"
      }`}
    >
      <span
        className={`inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform ${
          checked ? "translate-x-[18px]" : "translate-x-[3px]"
        }`}
      />
    </button>
  );
}

function SectionHeader({ title, description }: { title: string; description: string }) {
  return (
    <div className="pb-2 border-b border-neutral-200/50 dark:border-neutral-700/50">
      <h4 className="text-sm font-semibold text-foreground">{title}</h4>
      <p className="text-[11px] text-muted-foreground mt-0.5">{description}</p>
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
      <Label className="text-xs">{label}</Label>
      {children}
      {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function WhatsAppConfigPanel({
  config,
  onChange,
  rateLimitRpm,
  onRateLimitChange,
  webhookUrl,
  verifyTokenDisplay,
  approvedTemplates = [],
  campaignId,
}: WhatsAppConfigPanelProps) {
  const [activeTab, setActiveTab] = useState<TabId>("credentials");
  const [copied, setCopied] = useState(false);
  const [tabFading, setTabFading] = useState(false);
  const [tokenRevealed, setTokenRevealed] = useState(false);
  const [tokenCopied, setTokenCopied] = useState(false);
  const [contentHeight, setContentHeight] = useState<number | undefined>(undefined);
  const contentRef = useRef<HTMLDivElement>(null);

  // Measure content height for smooth transitions
  useEffect(() => {
    if (!contentRef.current || tabFading) return;
    const ro = new ResizeObserver(([entry]) => {
      setContentHeight(entry.contentRect.height);
    });
    ro.observe(contentRef.current);
    return () => ro.disconnect();
  }, [activeTab, tabFading]);

  const switchTab = useCallback((next: TabId) => {
    if (next === activeTab) return;
    setTabFading(true);
    setTimeout(() => {
      setActiveTab(next);
      requestAnimationFrame(() => setTabFading(false));
    }, 130);
  }, [activeTab]);

  function updateConfig<K extends keyof WhatsAppConfig>(
    key: K,
    value: Partial<WhatsAppConfig>[K]
  ) {
    onChange({ ...config, [key]: value });
  }

  /** Type-safe updater for businessHours — fills defaults so required fields are always present */
  function updateBusinessHours(patch: Partial<NonNullable<WhatsAppConfig["businessHours"]>>) {
    const current = config.businessHours ?? {
      enabled: false,
      timezone: "UTC",
      schedule: {},
      outsideHoursBehavior: "away_message" as const,
    };
    updateConfig("businessHours", { ...current, ...patch });
  }

  async function copyWebhookUrl() {
    if (!webhookUrl) return;
    await navigator.clipboard.writeText(webhookUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="w-full bg-white/70 dark:bg-neutral-900/70 backdrop-blur-xl border border-white/60 dark:border-neutral-700/40 shadow-[0_8px_32px_rgba(0,0,0,0.04)] rounded-[2rem] flex flex-col overflow-hidden">
      {/* Tab Navigation */}
      <div className="flex border-b border-neutral-200/50 dark:border-neutral-700/50 shrink-0">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => switchTab(tab.id)}
              style={isActive ? gradientBorderStyle : undefined}
              className={`flex-1 flex flex-col items-center gap-0.5 py-2.5 text-[10px] font-medium transition-all duration-200 border-b-2 ${
                isActive
                  ? "border-transparent text-foreground [--card-bg:rgba(255,255,255,0.7)] dark:[--card-bg:rgba(23,23,23,0.7)]"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:bg-black/[0.02] dark:hover:bg-white/[0.02]"
              }`}
              title={tab.description}
            >
              <Icon className={`w-3.5 h-3.5 transition-transform duration-200 ${isActive ? "scale-110" : ""}`} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div
        className="flex-1 overflow-y-auto overflow-x-hidden transition-[height] duration-300 ease-out"
        style={{ height: contentHeight !== undefined ? contentHeight + 40 : undefined }}
      >
        <div
          ref={contentRef}
          className={`p-5 space-y-5 transition-all duration-200 ease-out ${
            tabFading ? "opacity-0 translate-y-1" : "opacity-100 translate-y-0"
          }`}
        >
        {/* ═══════ CREDENTIALS TAB ═══════ */}
        {activeTab === "credentials" && (
          <>
            <SectionHeader
              title="Meta API Credentials"
              description="Connect your WhatsApp Business account via the Meta Cloud API."
            />

            <FieldGroup
              label="Phone Number ID"
              hint="From Meta Business Suite \u2192 WhatsApp \u2192 Phone Numbers"
            >
              <input
                value={config.phoneNumberId ?? ""}
                onChange={(e) => updateConfig("phoneNumberId", e.target.value)}
                className={`${INPUT_CLASS} font-mono`}
                placeholder="e.g. 123456789012345"
              />
            </FieldGroup>

            <FieldGroup
              label="Business Account ID *"
              hint="Your WhatsApp Business Account (WABA) ID — required for templates"
            >
              <input
                value={config.businessAccountId ?? ""}
                onChange={(e) => updateConfig("businessAccountId", e.target.value)}
                className={`${INPUT_CLASS} font-mono`}
                placeholder="e.g. 987654321098765"
              />
            </FieldGroup>

            <FieldGroup
              label="Access Token"
              hint="Long-lived system user token from Meta Business Suite"
            >
              <input
                type="password"
                value={config.accessToken ?? ""}
                onChange={(e) => updateConfig("accessToken", e.target.value)}
                className={`${INPUT_CLASS} font-mono`}
                placeholder="System user access token"
              />
            </FieldGroup>

            <FieldGroup
              label="Verify Token"
              hint="A secret you choose \u2014 used for webhook verification with Meta"
            >
              <input
                value={config.verifyToken ?? ""}
                onChange={(e) => updateConfig("verifyToken", e.target.value)}
                className={`${INPUT_CLASS} font-mono`}
                placeholder="Choose a secret string"
              />
            </FieldGroup>
          </>
        )}

        {/* ═══════ MESSAGING TAB ═══════ */}
        {activeTab === "messaging" && (
          <>
            <SectionHeader
              title="Response Behavior"
              description="Control how your agent responds to incoming WhatsApp messages."
            />

            <FieldGroup
              label="Response Delay (ms)"
              hint="Delay before sending a reply to feel more human-like (0 = instant)"
            >
              <input
                type="number"
                value={config.responseDelay ?? 2000}
                onChange={(e) => updateConfig("responseDelay", parseInt(e.target.value) || 0)}
                className={INPUT_CLASS}
                placeholder="2000"
                min={0}
                max={15000}
              />
            </FieldGroup>

            <div className="flex items-center justify-between">
              <div>
                <Label className="text-xs">Read Receipts</Label>
                <p className="text-[11px] text-muted-foreground">
                  Mark incoming messages as read (blue ticks)
                </p>
              </div>
              <Toggle
                checked={config.readReceipts !== false}
                onChange={(v) => updateConfig("readReceipts", v)}
              />
            </div>

            <hr className="border-neutral-200/50 dark:border-neutral-700/50" />

            <FieldGroup
              label="Rate Limit (RPM)"
              hint="Maximum replies per minute to avoid Meta throttling"
            >
              <input
                type="number"
                value={rateLimitRpm}
                onChange={(e) => onRateLimitChange(e.target.value)}
                className={INPUT_CLASS}
                placeholder="20 (default)"
                min={1}
                max={1000}
              />
            </FieldGroup>

            <hr className="border-neutral-200/50 dark:border-neutral-700/50" />

            <SectionHeader
              title="24-Hour Window Fallback"
              description="When a customer's session expires, send a template instead of a free-form reply."
            />

            <div className="flex items-center justify-between">
              <div>
                <Label className="text-xs">Enable Template Fallback</Label>
                <p className="text-[11px] text-muted-foreground">
                  Auto-send an approved template when the 24h window closes
                </p>
              </div>
              <Toggle
                checked={config.templateFallback?.enabled ?? false}
                onChange={(v) =>
                  updateConfig("templateFallback", {
                    ...config.templateFallback,
                    enabled: v,
                  })
                }
              />
            </div>

            {config.templateFallback?.enabled && (
              <FieldGroup
                label="Fallback Template"
                hint="Select an approved template to send when the session window expires"
              >
                <select
                  value={config.templateFallback?.templateId ?? ""}
                  onChange={(e) =>
                    updateConfig("templateFallback", {
                      ...config.templateFallback,
                      enabled: true,
                      templateId: e.target.value || undefined,
                    })
                  }
                  className={INPUT_CLASS}
                >
                  <option value="">— Select a template —</option>
                  {approvedTemplates.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.language})
                    </option>
                  ))}
                </select>
                {approvedTemplates.length === 0 && (
                  <p className="text-[10px] text-amber-600 dark:text-amber-400">
                    No approved templates yet. Sync or create templates in the Templates tab.
                  </p>
                )}
              </FieldGroup>
            )}
          </>
        )}

        {/* ═══════ ADVANCED TAB ═══════ */}
        {activeTab === "advanced" && (
          <>
            {/* Business Hours */}
            <SectionHeader
              title="Business Hours"
              description="Control when your agent responds automatically."
            />

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div>
                  <Label className="text-xs">Enable Business Hours</Label>
                  <p className="text-[11px] text-muted-foreground">
                    Only auto-respond during configured hours
                  </p>
                </div>
                {config.businessHours?.enabled && (() => {
                  const tz = config.businessHours?.timezone ?? "UTC";
                  const schedule = config.businessHours?.schedule ?? {};
                  const now = new Date();
                  const dayName = now.toLocaleDateString("en-US", { weekday: "long", timeZone: tz }).toLowerCase();
                  const daySchedule = schedule[dayName];
                  if (!daySchedule) {
                    return <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 font-medium">Closed today</span>;
                  }
                  const timeStr = now.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: tz });
                  const isOpen = timeStr >= daySchedule.open && timeStr < daySchedule.close;
                  return isOpen
                    ? <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 font-medium">Open now</span>
                    : <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 font-medium">Closed</span>;
                })()}
              </div>
              <Toggle
                checked={config.businessHours?.enabled ?? false}
                onChange={(v) =>
                  updateBusinessHours({
                    enabled: v,
                    timezone: config.businessHours?.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone,
                    schedule: config.businessHours?.schedule ?? {
                      monday: { open: "09:00", close: "17:00" },
                      tuesday: { open: "09:00", close: "17:00" },
                      wednesday: { open: "09:00", close: "17:00" },
                      thursday: { open: "09:00", close: "17:00" },
                      friday: { open: "09:00", close: "17:00" },
                      saturday: null,
                      sunday: null,
                    },
                  })
                }
              />
            </div>

            {config.businessHours?.enabled && (
              <div className="space-y-4 pl-1">
                <FieldGroup label="Timezone">
                  <select
                    value={config.businessHours?.timezone ?? "UTC"}
                    onChange={(e) =>
                      updateBusinessHours({ timezone: e.target.value })
                    }
                    className={INPUT_CLASS}
                  >
                    {(() => {
                      const detected = Intl.DateTimeFormat().resolvedOptions().timeZone;
                      const allTz = TIMEZONES.includes(detected) ? TIMEZONES : [detected, ...TIMEZONES];
                      return allTz.map((tz) => (
                        <option key={tz} value={tz}>
                          {tz}{tz === detected ? " (detected)" : ""}
                        </option>
                      ));
                    })()}
                  </select>
                </FieldGroup>

                {/* Quick presets */}
                <div className="space-y-1.5">
                  <Label className="text-xs">Quick Presets</Label>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { label: "9-5 Weekdays", schedule: { monday: { open: "09:00", close: "17:00" }, tuesday: { open: "09:00", close: "17:00" }, wednesday: { open: "09:00", close: "17:00" }, thursday: { open: "09:00", close: "17:00" }, friday: { open: "09:00", close: "17:00" }, saturday: null, sunday: null } },
                      { label: "9-6 Mon–Sat", schedule: { monday: { open: "09:00", close: "18:00" }, tuesday: { open: "09:00", close: "18:00" }, wednesday: { open: "09:00", close: "18:00" }, thursday: { open: "09:00", close: "18:00" }, friday: { open: "09:00", close: "18:00" }, saturday: { open: "09:00", close: "18:00" }, sunday: null } },
                      { label: "24/7", schedule: { monday: { open: "00:00", close: "23:59" }, tuesday: { open: "00:00", close: "23:59" }, wednesday: { open: "00:00", close: "23:59" }, thursday: { open: "00:00", close: "23:59" }, friday: { open: "00:00", close: "23:59" }, saturday: { open: "00:00", close: "23:59" }, sunday: { open: "00:00", close: "23:59" } } },
                    ].map((preset) => (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => updateBusinessHours({ schedule: preset.schedule })}
                        className="px-2.5 py-1 text-[10px] font-medium rounded-full border border-neutral-200/60 dark:border-[#2A2A2A] hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Per-day schedule */}
                <div className="space-y-2">
                  <Label className="text-xs">Schedule</Label>
                  {DAYS.map((day) => {
                    const schedule = config.businessHours?.schedule ?? {};
                    const dayVal = schedule[day.key];
                    const isOpen = dayVal !== null && dayVal !== undefined;
                    return (
                      <div key={day.key} className="flex items-center gap-2">
                        <Toggle
                          checked={isOpen}
                          onChange={(v) => {
                            const newSchedule = { ...schedule };
                            newSchedule[day.key] = v
                              ? { open: "09:00", close: "17:00" }
                              : null;
                            updateBusinessHours({ schedule: newSchedule });
                          }}
                        />
                        <span className="text-xs font-medium w-8">{day.label}</span>
                        {isOpen && dayVal ? (
                          <div className="flex items-center gap-1.5">
                            <input
                              type="time"
                              value={dayVal.open}
                              onChange={(e) => {
                                const newSchedule = { ...schedule };
                                newSchedule[day.key] = {
                                  ...dayVal,
                                  open: e.target.value,
                                };
                                updateBusinessHours({ schedule: newSchedule });
                              }}
                              className="text-xs rounded-lg border border-neutral-200/60 dark:border-[#2A2A2A] bg-white dark:bg-[#151515] px-2 py-1"
                            />
                            <span className="text-xs text-muted-foreground">to</span>
                            <input
                              type="time"
                              value={dayVal.close}
                              onChange={(e) => {
                                const newSchedule = { ...schedule };
                                newSchedule[day.key] = {
                                  ...dayVal,
                                  close: e.target.value,
                                };
                                updateBusinessHours({ schedule: newSchedule });
                              }}
                              className="text-xs rounded-lg border border-neutral-200/60 dark:border-[#2A2A2A] bg-white dark:bg-[#151515] px-2 py-1"
                            />
                          </div>
                        ) : (
                          <span className="text-[10px] text-muted-foreground">Closed</span>
                        )}
                      </div>
                    );
                  })}
                </div>

                <FieldGroup label="Outside Hours Behavior">
                  <select
                    value={config.businessHours?.outsideHoursBehavior ?? "away_message"}
                    onChange={(e) =>
                      updateBusinessHours({
                        outsideHoursBehavior: e.target.value as "queue" | "away_message" | "always_on",
                      })
                    }
                    className={INPUT_CLASS}
                  >
                    <option value="away_message">Send away message</option>
                    <option value="queue">Queue message (no response)</option>
                    <option value="always_on">Always respond (ignore hours)</option>
                  </select>
                </FieldGroup>

                {config.businessHours?.outsideHoursBehavior === "away_message" && (
                  <FieldGroup label="Away Message" hint="Sent when a customer messages outside business hours">
                    <textarea
                      value={config.businessHours?.awayMessage ?? ""}
                      onChange={(e) =>
                        updateBusinessHours({ awayMessage: e.target.value })
                      }
                      rows={2}
                      className={TEXTAREA_CLASS}
                      placeholder="e.g., Thanks for your message! We're currently outside business hours. We'll get back to you as soon as we're open."
                    />
                  </FieldGroup>
                )}
              </div>
            )}

            <hr className="border-neutral-200/50 dark:border-neutral-700/50" />

            {/* Voice Notes */}
            <SectionHeader
              title="Voice Notes"
              description="Transcribe incoming voice messages using OpenAI Whisper."
            />

            <div className="flex items-center justify-between">
              <div>
                <Label className="text-xs">Enable Transcription</Label>
                <p className="text-[11px] text-muted-foreground">
                  Automatically transcribe voice notes to text for AI processing
                </p>
              </div>
              <Toggle
                checked={config.voiceNotes?.transcriptionEnabled ?? false}
                onChange={(v) =>
                  updateConfig("voiceNotes", {
                    transcriptionEnabled: v,
                  })
                }
              />
            </div>

            <hr className="border-neutral-200/50 dark:border-neutral-700/50" />

            {/* Image Handling */}
            <SectionHeader
              title="Image Handling"
              description="Describe incoming images using vision AI for context-aware responses."
            />

            <div className="flex items-center justify-between">
              <div>
                <Label className="text-xs">Enable Vision</Label>
                <p className="text-[11px] text-muted-foreground">
                  Describe images with AI so your agent can respond to visual content
                </p>
              </div>
              <Toggle
                checked={config.imageHandling?.visionEnabled ?? false}
                onChange={(v) =>
                  updateConfig("imageHandling", {
                    visionEnabled: v,
                  })
                }
              />
            </div>

            {campaignId && (
              <>
                <hr className="border-neutral-200/50 dark:border-neutral-700/50" />
                <EventsConfigPanel campaignId={campaignId} />
              </>
            )}
          </>
        )}

        {/* ═══════ DEPLOY TAB ═══════ */}
        {activeTab === "deploy" && (
          <>
            <SectionHeader
              title="Webhook Setup"
              description="Configure your Meta App Dashboard to receive messages."
            />

            {webhookUrl ? (
              <>
                {/* Webhook URL */}
                <div className="space-y-1.5">
                  <Label className="text-xs">Webhook URL</Label>
                  <div className="relative">
                    <pre className="bg-neutral-100/60 dark:bg-neutral-800/40 rounded-2xl p-3 text-xs font-mono text-foreground/80 overflow-x-auto whitespace-pre-wrap break-all border border-neutral-200/50 dark:border-neutral-700/50">
                      {webhookUrl}
                    </pre>
                    <button
                      type="button"
                      onClick={copyWebhookUrl}
                      className="absolute top-2 right-2 px-2.5 py-1 text-[10px] font-medium bg-card/80 backdrop-blur-md border border-border/40 rounded-full hover:bg-muted/50 transition-colors"
                    >
                      {copied ? (
                        <span className="flex items-center gap-1">
                          <Check className="w-3 h-3 text-emerald-500" />
                          Copied
                        </span>
                      ) : (
                        <span className="flex items-center gap-1">
                          <Copy className="w-3 h-3" />
                          Copy
                        </span>
                      )}
                    </button>
                  </div>
                </div>

                {/* Verify Token Display — masked by default */}
                <div className="space-y-1.5">
                  <Label className="text-xs">Verify Token</Label>
                  <div className="relative">
                    <pre className="bg-neutral-100/60 dark:bg-neutral-800/40 rounded-2xl p-3 pr-20 text-xs font-mono text-foreground/80 border border-neutral-200/50 dark:border-neutral-700/50">
                      {tokenRevealed
                        ? verifyTokenDisplay
                        : verifyTokenDisplay.length > 4
                          ? `${"•".repeat(Math.max(verifyTokenDisplay.length - 4, 8))}${verifyTokenDisplay.slice(-4)}`
                          : "•".repeat(8)}
                    </pre>
                    <div className="absolute top-2 right-2 flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setTokenRevealed((v) => !v)}
                        className="px-2 py-1 text-[10px] font-medium bg-card/80 backdrop-blur-md border border-border/40 rounded-full hover:bg-muted/50 transition-colors"
                        title={tokenRevealed ? "Hide" : "Reveal"}
                      >
                        {tokenRevealed ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          await navigator.clipboard.writeText(verifyTokenDisplay);
                          setTokenCopied(true);
                          setTimeout(() => setTokenCopied(false), 2000);
                        }}
                        className="px-2 py-1 text-[10px] font-medium bg-card/80 backdrop-blur-md border border-border/40 rounded-full hover:bg-muted/50 transition-colors"
                        title="Copy"
                      >
                        {tokenCopied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                      </button>
                    </div>
                  </div>
                </div>

                <hr className="border-neutral-200/50 dark:border-neutral-700/50" />

                {/* Setup instructions */}
                <div
                  className="rounded-[20px] border-2 border-transparent p-4 space-y-2 [--card-bg:#f8f9fa] dark:[--card-bg:#1E1E1E]"
                  style={gradientBorderStyle}
                >
                  <p className="text-xs font-semibold text-foreground">
                    Setup Instructions
                  </p>
                  <ol className="text-[11px] text-muted-foreground space-y-1.5 list-decimal pl-4">
                    <li>
                      Go to your{" "}
                      <span className="text-foreground font-medium">
                        Meta App Dashboard
                      </span>{" "}
                      &rarr; WhatsApp &rarr; Configuration
                    </li>
                    <li>Paste the Webhook URL above as the Callback URL</li>
                    <li>Enter the Verify Token shown above</li>
                    <li>
                      Subscribe to the{" "}
                      <code className="text-[10px] bg-muted px-1 py-0.5 rounded font-mono">
                        messages
                      </code>{" "}
                      webhook field
                    </li>
                  </ol>
                </div>
              </>
            ) : (
              <div className="rounded-2xl border border-dashed border-neutral-300/60 dark:border-neutral-700/50 bg-neutral-100/30 dark:bg-neutral-800/20 p-4">
                <p className="text-xs text-muted-foreground text-center">
                  Deploy your campaign to get the webhook URL. Click &ldquo;Deploy&rdquo; in the top bar when you&apos;re ready.
                </p>
              </div>
            )}
          </>
        )}
        </div>
      </div>
    </div>
  );
}
