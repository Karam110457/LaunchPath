"use client";

import { useState } from "react";
import { Plus, X, Palette, MessageSquare, MousePointer2, Settings2 } from "lucide-react";
import { Label } from "@/components/ui/label";
import type { WidgetConfig } from "@/lib/channels/types";

const INPUT_CLASS =
  "w-full rounded-xl border border-neutral-200/60 dark:border-[#2A2A2A] bg-white dark:bg-[#151515] px-3 py-2 text-sm shadow-sm outline-none focus:ring-2 focus:ring-neutral-400/20 focus:border-neutral-400/50 dark:focus:ring-neutral-500/20 dark:focus:border-neutral-500/40 transition-all placeholder:text-muted-foreground/50";

const TEXTAREA_CLASS =
  "w-full rounded-xl border border-neutral-200/60 dark:border-[#2A2A2A] bg-white dark:bg-[#151515] px-3 py-2 text-sm shadow-sm outline-none focus:ring-2 focus:ring-neutral-400/20 focus:border-neutral-400/50 dark:focus:ring-neutral-500/20 dark:focus:border-neutral-500/40 transition-all placeholder:text-muted-foreground/50 resize-none";

interface ConfigPanelProps {
  config: WidgetConfig;
  onChange: (config: WidgetConfig) => void;
  clientWebsite: string;
  onClientWebsiteChange: (url: string) => void;
  allowedOrigins: string;
  onAllowedOriginsChange: (origins: string) => void;
  embedCode: string | null;
}

const TABS = [
  { id: "appearance", label: "Appearance", icon: Palette, description: "Colors, theme & size" },
  { id: "content", label: "Content", icon: MessageSquare, description: "Messages & identity" },
  { id: "button", label: "Button", icon: MousePointer2, description: "Launcher & greeting" },
  { id: "deploy", label: "Deploy", icon: Settings2, description: "Website & embed" },
] as const;

type TabId = (typeof TABS)[number]["id"];

/** Inline style for gradient border via background-clip trick */
const gradientBorderStyle: React.CSSProperties = {
  backgroundImage:
    "linear-gradient(var(--card-bg), var(--card-bg)), linear-gradient(135deg, #FF8C00, #9D50BB)",
  backgroundOrigin: "border-box",
  backgroundClip: "padding-box, border-box",
};

const gradientBorderHoverStyle: React.CSSProperties = {
  backgroundImage:
    "linear-gradient(var(--card-bg), var(--card-bg)), linear-gradient(135deg, rgba(255,140,0,0.45), rgba(157,80,187,0.45))",
  backgroundOrigin: "border-box",
  backgroundClip: "padding-box, border-box",
};

function ToggleButton({
  options,
  value,
  onChange,
}: {
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
}) {
  const [hovered, setHovered] = useState<string | null>(null);

  return (
    <div className="flex gap-1.5">
      {options.map((opt) => {
        const isSelected = value === opt.value;
        const isHovered = hovered === opt.value && !isSelected;

        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            onMouseEnter={() => setHovered(opt.value)}
            onMouseLeave={() => setHovered(null)}
            style={
              isSelected
                ? gradientBorderStyle
                : isHovered
                  ? gradientBorderHoverStyle
                  : undefined
            }
            className={`flex-1 px-3 py-1.5 rounded-full text-xs font-medium transition-all border-2 ${
              isSelected
                ? "[--card-bg:#ffffff] dark:[--card-bg:#151515] border-transparent bg-card text-foreground shadow-sm"
                : isHovered
                  ? "[--card-bg:#ffffff] dark:[--card-bg:#151515] border-transparent text-foreground"
                  : "border-border/40 bg-card/60 text-muted-foreground"
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

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

export function ConfigPanel({
  config,
  onChange,
  clientWebsite,
  onClientWebsiteChange,
  allowedOrigins,
  onAllowedOriginsChange,
  embedCode,
}: ConfigPanelProps) {
  const [activeTab, setActiveTab] = useState<TabId>("appearance");
  const starters = config.conversationStarters ?? [];

  function updateConfig<K extends keyof WidgetConfig>(
    key: K,
    value: WidgetConfig[K]
  ) {
    onChange({ ...config, [key]: value });
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
    updateConfig(
      "conversationStarters",
      starters.filter((_, i) => i !== index)
    );
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
              className={`flex-1 flex flex-col items-center gap-0.5 py-2.5 text-[10px] font-medium transition-all border-b-2 ${
                isActive
                  ? "border-foreground text-foreground"
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
        {/* ═══════ APPEARANCE TAB ═══════ */}
        {activeTab === "appearance" && (
          <>
            <SectionHeader
              title="Look & Feel"
              description="Control how the widget looks on your client's website."
            />

            <FieldGroup label="Primary Color" hint="The main color used for the header, buttons, and user messages.">
              <div className="flex gap-2 items-center">
                <input
                  value={config.primaryColor || "#6366f1"}
                  onChange={(e) => updateConfig("primaryColor", e.target.value)}
                  className={`${INPUT_CLASS} flex-1 font-mono`}
                  placeholder="#6366f1"
                />
                <label className="relative w-9 h-9 rounded-xl border border-neutral-200/60 dark:border-[#2A2A2A] shrink-0 cursor-pointer overflow-hidden shadow-sm">
                  <input
                    type="color"
                    value={config.primaryColor || "#6366f1"}
                    onChange={(e) => updateConfig("primaryColor", e.target.value)}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div
                    className="w-full h-full rounded-xl"
                    style={{ backgroundColor: config.primaryColor || "#6366f1" }}
                  />
                </label>
              </div>
            </FieldGroup>

            <FieldGroup label="Theme">
              <ToggleButton
                options={[
                  { value: "light", label: "Light" },
                  { value: "dark", label: "Dark" },
                ]}
                value={config.theme || "light"}
                onChange={(v) => updateConfig("theme", v as "light" | "dark")}
              />
            </FieldGroup>

            <FieldGroup label="Corner Style" hint="Rounded gives a modern look. Sharp gives a more structured feel.">
              <ToggleButton
                options={[
                  { value: "rounded", label: "Rounded" },
                  { value: "sharp", label: "Sharp" },
                ]}
                value={config.borderRadius || "rounded"}
                onChange={(v) => updateConfig("borderRadius", v as "rounded" | "sharp")}
              />
            </FieldGroup>

            <FieldGroup label="Widget Size" hint="Controls the overall size of the chat widget and button.">
              <ToggleButton
                options={[
                  { value: "compact", label: "Compact" },
                  { value: "default", label: "Default" },
                  { value: "large", label: "Large" },
                ]}
                value={config.widgetSize || "default"}
                onChange={(v) => updateConfig("widgetSize", v as "compact" | "default" | "large")}
              />
              <p className="text-[10px] text-muted-foreground/70">
                {config.widgetSize === "compact"
                  ? "Compact: Smaller button (48px), narrower chat (340px), smaller text"
                  : config.widgetSize === "large"
                  ? "Large: Bigger button (64px), wider chat (420px), larger text"
                  : "Default: Standard button (56px), standard chat (380px)"}
              </p>
            </FieldGroup>

            <div className="flex items-center justify-between">
              <div>
                <Label className="text-xs">Show &ldquo;Powered by&rdquo;</Label>
                <p className="text-[11px] text-muted-foreground">
                  Display LaunchPath branding in the widget footer.
                </p>
              </div>
              <Toggle
                checked={config.showBranding !== false}
                onChange={(v) => updateConfig("showBranding", v)}
              />
            </div>
          </>
        )}

        {/* ═══════ CONTENT TAB ═══════ */}
        {activeTab === "content" && (
          <>
            <SectionHeader
              title="Identity & Messages"
              description="Set up your agent's name, avatar, and what it says to visitors."
            />

            <FieldGroup label="Display Name" hint="Shown at the top of the chat window.">
              <input
                value={config.agentName || ""}
                onChange={(e) => updateConfig("agentName", e.target.value)}
                className={INPUT_CLASS}
                placeholder="AI Assistant"
              />
            </FieldGroup>

            <FieldGroup label="Chat Avatar" hint="An image URL or emoji shown next to the name in the header.">
              <input
                value={config.agentAvatar || ""}
                onChange={(e) => updateConfig("agentAvatar", e.target.value)}
                className={INPUT_CLASS}
                placeholder="https://... or emoji like 🤖"
              />
            </FieldGroup>

            <FieldGroup label="Welcome Message" hint="The first message visitors see when they open the chat.">
              <textarea
                value={config.welcomeMessage || ""}
                onChange={(e) => updateConfig("welcomeMessage", e.target.value)}
                rows={2}
                className={TEXTAREA_CLASS}
                placeholder="Hi! How can I help you today?"
              />
            </FieldGroup>

            <div className="space-y-2">
              <Label className="text-xs">Quick Reply Buttons</Label>
              <p className="text-[11px] text-muted-foreground -mt-1">
                Suggested messages visitors can click to start a conversation.
              </p>
              <div className="space-y-1.5">
                {starters.map((s, i) => (
                  <div key={i} className="flex gap-1.5">
                    <input
                      value={s}
                      onChange={(e) => updateStarter(i, e.target.value)}
                      className={`${INPUT_CLASS} flex-1 text-xs py-1.5`}
                      placeholder={`e.g. "What services do you offer?"`}
                    />
                    <button
                      type="button"
                      onClick={() => removeStarter(i)}
                      className="p-1 rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
              {starters.length < 4 && (
                <button
                  type="button"
                  onClick={addStarter}
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Plus className="w-3 h-3" />
                  Add quick reply
                </button>
              )}
            </div>

            <hr className="border-neutral-200/50 dark:border-neutral-700/50" />

            <div className="flex items-center justify-between">
              <div>
                <Label className="text-xs">Pre-Chat Form</Label>
                <p className="text-[11px] text-muted-foreground">
                  Collect visitor name and email before they start chatting.
                </p>
              </div>
              <Toggle
                checked={config.preChatForm?.enabled ?? false}
                onChange={(v) =>
                  updateConfig("preChatForm", {
                    enabled: v,
                    fields: config.preChatForm?.fields ?? ["name", "email"],
                  })
                }
              />
            </div>

            {config.preChatForm?.enabled && (
              <div className="pl-2 space-y-2">
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-1.5 text-xs">
                    <input
                      type="checkbox"
                      checked={config.preChatForm?.fields?.includes("name") ?? true}
                      onChange={(e) => {
                        const fields = [...(config.preChatForm?.fields ?? ["name", "email"])];
                        if (e.target.checked) {
                          if (!fields.includes("name")) fields.unshift("name");
                        } else {
                          const idx = fields.indexOf("name");
                          if (idx >= 0) fields.splice(idx, 1);
                        }
                        updateConfig("preChatForm", { enabled: true, fields: fields as ("name" | "email")[] });
                      }}
                      className="rounded"
                    />
                    Name
                  </label>
                  <label className="flex items-center gap-1.5 text-xs">
                    <input
                      type="checkbox"
                      checked={config.preChatForm?.fields?.includes("email") ?? true}
                      onChange={(e) => {
                        const fields = [...(config.preChatForm?.fields ?? ["name", "email"])];
                        if (e.target.checked) {
                          if (!fields.includes("email")) fields.push("email");
                        } else {
                          const idx = fields.indexOf("email");
                          if (idx >= 0) fields.splice(idx, 1);
                        }
                        updateConfig("preChatForm", { enabled: true, fields: fields as ("name" | "email")[] });
                      }}
                      className="rounded"
                    />
                    Email
                  </label>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between">
              <div>
                <Label className="text-xs">Post-Chat Survey</Label>
                <p className="text-[11px] text-muted-foreground">
                  Show a satisfaction rating after the conversation closes.
                </p>
              </div>
              <Toggle
                checked={config.csatSurvey?.enabled ?? false}
                onChange={(v) => updateConfig("csatSurvey", { enabled: v })}
              />
            </div>

            <hr className="border-neutral-200/50 dark:border-neutral-700/50" />

            <div className="flex items-center justify-between">
              <div>
                <Label className="text-xs">File Uploads</Label>
                <p className="text-[11px] text-muted-foreground">
                  Allow visitors to send images and PDFs in the chat.
                </p>
              </div>
              <Toggle
                checked={config.fileUpload?.enabled !== false}
                onChange={(v) => updateConfig("fileUpload", { enabled: v })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label className="text-xs">End Chat Button</Label>
                <p className="text-[11px] text-muted-foreground">
                  Let visitors close the conversation from the widget header.
                </p>
              </div>
              <Toggle
                checked={config.endChat?.enabled !== false}
                onChange={(v) => updateConfig("endChat", { enabled: v })}
              />
            </div>

            <hr className="border-neutral-200/50 dark:border-neutral-700/50" />

            <div className="flex items-center justify-between">
              <div>
                <Label className="text-xs">Auto-Escalation</Label>
                <p className="text-[11px] text-muted-foreground">
                  Automatically transfer to a human when keywords or loops are detected.
                </p>
              </div>
              <Toggle
                checked={config.autoEscalation?.enabled !== false}
                onChange={(v) =>
                  updateConfig("autoEscalation", {
                    enabled: v,
                    keywords: config.autoEscalation?.keywords ?? [],
                  })
                }
              />
            </div>

            {config.autoEscalation?.enabled !== false && (
              <div className="pl-2 space-y-2">
                <FieldGroup
                  label="Custom Keywords"
                  hint="Add trigger phrases that will escalate to a human agent. Leave empty for defaults (e.g. &ldquo;talk to a human&rdquo;)."
                >
                  <div className="space-y-1.5">
                    {(config.autoEscalation?.keywords ?? []).map((kw, i) => (
                      <div key={i} className="flex gap-1.5">
                        <input
                          value={kw}
                          onChange={(e) => {
                            const keywords = [...(config.autoEscalation?.keywords ?? [])];
                            keywords[i] = e.target.value;
                            updateConfig("autoEscalation", { enabled: true, keywords });
                          }}
                          className={`${INPUT_CLASS} flex-1 text-xs py-1.5`}
                          placeholder="e.g. talk to support"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const keywords = (config.autoEscalation?.keywords ?? []).filter((_, idx) => idx !== i);
                            updateConfig("autoEscalation", { enabled: true, keywords });
                          }}
                          className="p-1 rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const keywords = [...(config.autoEscalation?.keywords ?? []), ""];
                      updateConfig("autoEscalation", { enabled: true, keywords });
                    }}
                    className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Plus className="w-3 h-3" />
                    Add keyword
                  </button>
                </FieldGroup>
              </div>
            )}

            <div className="flex items-center justify-between">
              <div>
                <Label className="text-xs">Auto-Close Stale Conversations</Label>
                <p className="text-[11px] text-muted-foreground">
                  Automatically close conversations after a period of inactivity.
                </p>
              </div>
              <Toggle
                checked={config.autoClose?.enabled !== false}
                onChange={(v) =>
                  updateConfig("autoClose", {
                    enabled: v,
                    hours: config.autoClose?.hours ?? 24,
                  })
                }
              />
            </div>

            {config.autoClose?.enabled !== false && (
              <div className="pl-2">
                <FieldGroup label="Inactivity Period" hint="Hours of inactivity before auto-closing.">
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={1}
                      max={168}
                      value={config.autoClose?.hours ?? 24}
                      onChange={(e) =>
                        updateConfig("autoClose", {
                          enabled: true,
                          hours: parseInt(e.target.value) || 24,
                        })
                      }
                      className={`${INPUT_CLASS} w-20`}
                    />
                    <span className="text-xs text-muted-foreground">hours</span>
                  </div>
                </FieldGroup>
              </div>
            )}
          </>
        )}

        {/* ═══════ BUTTON TAB ═══════ */}
        {activeTab === "button" && (
          <>
            <SectionHeader
              title="Chat Button & Greeting"
              description="Customize the floating button and the greeting that appears before visitors open the chat."
            />

            <FieldGroup label="Button Icon" hint="Custom icon for the floating chat button. Leave empty for the default chat bubble.">
              <input
                value={config.launcherIcon || ""}
                onChange={(e) => updateConfig("launcherIcon", e.target.value)}
                className={INPUT_CLASS}
                placeholder="https://... or emoji like 💬"
              />
            </FieldGroup>

            <FieldGroup label="Button Position" hint="Which corner of the screen the chat button appears in.">
              <ToggleButton
                options={[
                  { value: "right", label: "Bottom Right" },
                  { value: "left", label: "Bottom Left" },
                ]}
                value={config.position || "right"}
                onChange={(v) => updateConfig("position", v as "right" | "left")}
              />
            </FieldGroup>

            <hr className="border-neutral-200/50 dark:border-neutral-700/50" />

            <FieldGroup
              label="Greeting Message"
              hint="A small popup message that appears next to the chat button to encourage visitors to start a conversation. Leave empty to disable."
            >
              <textarea
                value={config.greetingMessage || ""}
                onChange={(e) => updateConfig("greetingMessage", e.target.value)}
                rows={2}
                className={TEXTAREA_CLASS}
                placeholder="👋 Hi there! Need any help?"
              />
            </FieldGroup>

            <FieldGroup
              label="Greeting Delay"
              hint="How many seconds after the page loads before the greeting appears."
            >
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={0}
                  max={60}
                  value={config.greetingDelay ?? 3}
                  onChange={(e) => updateConfig("greetingDelay", parseInt(e.target.value) || 0)}
                  className={`${INPUT_CLASS} w-20`}
                />
                <span className="text-xs text-muted-foreground">seconds</span>
              </div>
            </FieldGroup>
          </>
        )}

        {/* ═══════ DEPLOY TAB ═══════ */}
        {activeTab === "deploy" && (
          <>
            <SectionHeader
              title="Website & Embed"
              description="Set up which website this widget will be installed on."
            />

            <FieldGroup label="Client Website" hint="Preview how the widget looks on this website. Used for the live preview on the right.">
              <input
                value={clientWebsite}
                onChange={(e) => onClientWebsiteChange(e.target.value)}
                className={INPUT_CLASS}
                placeholder="https://example.com"
              />
            </FieldGroup>

            <FieldGroup
              label="Allowed Websites"
              hint="Only these websites can use the widget. Leave empty to allow any website. One URL per line."
            >
              <textarea
                value={allowedOrigins}
                onChange={(e) => onAllowedOriginsChange(e.target.value)}
                rows={3}
                className={`${TEXTAREA_CLASS} font-mono`}
                placeholder={"https://example.com\nhttps://staging.example.com"}
              />
            </FieldGroup>

            {/* Embed Code */}
            {embedCode && (
              <>
                <hr className="border-neutral-200/50 dark:border-neutral-700/50" />
                <div className="space-y-1.5">
                  <Label className="text-xs">Embed Code</Label>
                  <p className="text-[11px] text-muted-foreground">
                    Copy this code and paste it before the closing <code className="text-[10px] bg-muted px-1 py-0.5 rounded">&lt;/body&gt;</code> tag on your client&apos;s website.
                  </p>
                  <div className="relative">
                    <pre className="bg-neutral-100/60 dark:bg-neutral-800/40 rounded-2xl p-3 text-xs font-mono text-foreground/80 overflow-x-auto whitespace-pre-wrap break-all border border-neutral-200/50 dark:border-neutral-700/50">
                      {embedCode}
                    </pre>
                    <button
                      type="button"
                      onClick={() => navigator.clipboard.writeText(embedCode)}
                      className="absolute top-2 right-2 px-2.5 py-1 text-[10px] font-medium bg-card/80 backdrop-blur-md border border-border/40 rounded-full hover:bg-muted/50 transition-colors"
                    >
                      Copy
                    </button>
                  </div>
                </div>
              </>
            )}

            {!embedCode && (
              <div className="rounded-2xl border border-dashed border-neutral-300/60 dark:border-neutral-700/50 bg-neutral-100/30 dark:bg-neutral-800/20 p-4">
                <p className="text-xs text-muted-foreground text-center">
                  Deploy your widget to get the embed code. Click &ldquo;Deploy&rdquo; in the top bar when you&apos;re ready.
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
