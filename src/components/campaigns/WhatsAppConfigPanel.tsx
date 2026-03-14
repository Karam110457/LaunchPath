"use client";

import { useState } from "react";
import { Copy, Check, Shield, MessageSquare, Settings2, Sliders } from "lucide-react";
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

  function updateConfig<K extends keyof WhatsAppConfig>(
    key: K,
    value: WhatsAppConfig[K]
  ) {
    onChange({ ...config, [key]: value });
  }

  async function copyWebhookUrl() {
    if (!webhookUrl) return;
    await navigator.clipboard.writeText(webhookUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="w-full flex flex-col">
      {/* Tab Navigation */}
      <div className="flex gap-1 pb-4 border-b border-neutral-200/60 dark:border-neutral-700/40 shrink-0">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium rounded-lg transition-all ${
                isActive
                  ? "bg-neutral-900 dark:bg-white text-white dark:text-neutral-900"
                  : "text-muted-foreground hover:text-foreground hover:bg-neutral-100 dark:hover:bg-neutral-800"
              }`}
              title={tab.description}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="flex-1 pt-5 space-y-5">
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
              label="Greeting Message"
              hint="Optional message sent to first-time contacts"
            >
              <textarea
                value={config.greetingMessage ?? ""}
                onChange={(e) => updateConfig("greetingMessage", e.target.value)}
                rows={2}
                className={TEXTAREA_CLASS}
                placeholder="e.g., Hi! Thanks for reaching out. How can I help?"
              />
            </FieldGroup>

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
                  updateConfig("templateFallback" as keyof WhatsAppConfig, {
                    ...config.templateFallback,
                    enabled: v,
                  } as never)
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
                    updateConfig("templateFallback" as keyof WhatsAppConfig, {
                      ...config.templateFallback,
                      enabled: true,
                      templateId: e.target.value || undefined,
                    } as never)
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
              <div>
                <Label className="text-xs">Enable Business Hours</Label>
                <p className="text-[11px] text-muted-foreground">
                  Only auto-respond during configured hours
                </p>
              </div>
              <Toggle
                checked={config.businessHours?.enabled ?? false}
                onChange={(v) =>
                  updateConfig("businessHours" as keyof WhatsAppConfig, {
                    ...config.businessHours,
                    enabled: v,
                    timezone: config.businessHours?.timezone ?? "UTC",
                    schedule: config.businessHours?.schedule ?? {
                      monday: { open: "09:00", close: "17:00" },
                      tuesday: { open: "09:00", close: "17:00" },
                      wednesday: { open: "09:00", close: "17:00" },
                      thursday: { open: "09:00", close: "17:00" },
                      friday: { open: "09:00", close: "17:00" },
                      saturday: null,
                      sunday: null,
                    },
                    outsideHoursBehavior: config.businessHours?.outsideHoursBehavior ?? "away_message",
                  } as never)
                }
              />
            </div>

            {config.businessHours?.enabled && (
              <div className="space-y-4 pl-1">
                <FieldGroup label="Timezone">
                  <select
                    value={config.businessHours?.timezone ?? "UTC"}
                    onChange={(e) =>
                      updateConfig("businessHours" as keyof WhatsAppConfig, {
                        ...config.businessHours,
                        timezone: e.target.value,
                      } as never)
                    }
                    className={INPUT_CLASS}
                  >
                    {TIMEZONES.map((tz) => (
                      <option key={tz} value={tz}>{tz}</option>
                    ))}
                  </select>
                </FieldGroup>

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
                            updateConfig("businessHours" as keyof WhatsAppConfig, {
                              ...config.businessHours,
                              schedule: newSchedule,
                            } as never);
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
                                updateConfig("businessHours" as keyof WhatsAppConfig, {
                                  ...config.businessHours,
                                  schedule: newSchedule,
                                } as never);
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
                                updateConfig("businessHours" as keyof WhatsAppConfig, {
                                  ...config.businessHours,
                                  schedule: newSchedule,
                                } as never);
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
                      updateConfig("businessHours" as keyof WhatsAppConfig, {
                        ...config.businessHours,
                        outsideHoursBehavior: e.target.value,
                      } as never)
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
                        updateConfig("businessHours" as keyof WhatsAppConfig, {
                          ...config.businessHours,
                          awayMessage: e.target.value,
                        } as never)
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
                  updateConfig("voiceNotes" as keyof WhatsAppConfig, {
                    transcriptionEnabled: v,
                  } as never)
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
                  updateConfig("imageHandling" as keyof WhatsAppConfig, {
                    visionEnabled: v,
                  } as never)
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

                {/* Verify Token Display */}
                <div className="space-y-1.5">
                  <Label className="text-xs">Verify Token</Label>
                  <pre className="bg-neutral-100/60 dark:bg-neutral-800/40 rounded-2xl p-3 text-xs font-mono text-foreground/80 border border-neutral-200/50 dark:border-neutral-700/50">
                    {verifyTokenDisplay}
                  </pre>
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
  );
}
