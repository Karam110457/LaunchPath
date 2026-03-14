"use client";

import { useState } from "react";
import { Copy, Check, Shield, MessageSquare, Settings2 } from "lucide-react";
import { Label } from "@/components/ui/label";
import type { WhatsAppConfig } from "@/lib/channels/types";

const INPUT_CLASS =
  "w-full rounded-xl border border-neutral-200/60 dark:border-[#2A2A2A] bg-white dark:bg-[#151515] px-3 py-2 text-sm shadow-sm outline-none focus:ring-2 focus:ring-neutral-400/20 focus:border-neutral-400/50 dark:focus:ring-neutral-500/20 dark:focus:border-neutral-500/40 transition-all placeholder:text-muted-foreground/50";

const TEXTAREA_CLASS =
  "w-full rounded-xl border border-neutral-200/60 dark:border-[#2A2A2A] bg-white dark:bg-[#151515] px-3 py-2 text-sm shadow-sm outline-none focus:ring-2 focus:ring-neutral-400/20 focus:border-neutral-400/50 dark:focus:ring-neutral-500/20 dark:focus:border-neutral-500/40 transition-all placeholder:text-muted-foreground/50 resize-none";

interface WhatsAppConfigPanelProps {
  config: Partial<WhatsAppConfig>;
  onChange: (config: Partial<WhatsAppConfig>) => void;
  rateLimitRpm: string;
  onRateLimitChange: (rpm: string) => void;
  webhookUrl: string | null;
  verifyTokenDisplay: string;
}

const TABS = [
  { id: "credentials", label: "Credentials", icon: Shield, description: "API keys & tokens" },
  { id: "messaging", label: "Messaging", icon: MessageSquare, description: "Responses & behavior" },
  { id: "deploy", label: "Deploy", icon: Settings2, description: "Webhook & setup" },
] as const;

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
    <div className="w-[400px] shrink-0 bg-white/70 dark:bg-neutral-900/70 backdrop-blur-xl border border-white/60 dark:border-neutral-700/40 shadow-[0_8px_32px_rgba(0,0,0,0.04)] rounded-[2rem] flex flex-col h-full overflow-hidden">
      {/* Tab Navigation */}
      <div className="flex border-b border-neutral-200/50 dark:border-neutral-700/50 shrink-0">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              style={isActive ? gradientBorderStyle : undefined}
              className={`flex-1 flex flex-col items-center gap-0.5 py-2.5 text-[10px] font-medium transition-all border-b-2 ${
                isActive
                  ? "border-transparent text-foreground [--card-bg:rgba(255,255,255,0.7)] dark:[--card-bg:rgba(23,23,23,0.7)]"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:bg-black/[0.02] dark:hover:bg-white/[0.02]"
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
      <div className="flex-1 overflow-y-auto p-5 space-y-5">
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
