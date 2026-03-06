"use client";

import { useState } from "react";
import { Plus, X, Palette, MessageSquare, MousePointer2, Settings2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { WidgetConfig } from "@/lib/channels/types";

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

function ToggleButton({
  options,
  value,
  onChange,
}: {
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex gap-1.5">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={`flex-1 px-3 py-1.5 rounded-md text-xs font-medium border transition-all ${
            value === opt.value
              ? "bg-primary/10 border-primary/30 text-primary"
              : "bg-muted/50 border-border text-muted-foreground hover:border-primary/30"
          }`}
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
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
        checked ? "bg-primary" : "bg-muted"
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
    <div className="pb-2 border-b border-border/50">
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
    <div className="w-[400px] shrink-0 border-r border-border flex flex-col h-full">
      {/* Tab Navigation */}
      <div className="flex border-b border-border shrink-0">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex flex-col items-center gap-0.5 py-2.5 text-[10px] font-medium transition-all border-b-2 ${
                activeTab === tab.id
                  ? "border-primary text-primary bg-primary/5"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/30"
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
                <Input
                  value={config.primaryColor || "#6366f1"}
                  onChange={(e) => updateConfig("primaryColor", e.target.value)}
                  className="h-8 text-sm flex-1 font-mono"
                  placeholder="#6366f1"
                />
                <label className="relative w-8 h-8 rounded-md border border-border shrink-0 cursor-pointer overflow-hidden">
                  <input
                    type="color"
                    value={config.primaryColor || "#6366f1"}
                    onChange={(e) => updateConfig("primaryColor", e.target.value)}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div
                    className="w-full h-full rounded-md"
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
              <Input
                value={config.agentName || ""}
                onChange={(e) => updateConfig("agentName", e.target.value)}
                className="h-8 text-sm"
                placeholder="AI Assistant"
              />
            </FieldGroup>

            <FieldGroup label="Chat Avatar" hint="An image URL or emoji shown next to the name in the header.">
              <Input
                value={config.agentAvatar || ""}
                onChange={(e) => updateConfig("agentAvatar", e.target.value)}
                className="h-8 text-sm"
                placeholder="https://... or emoji like 🤖"
              />
            </FieldGroup>

            <FieldGroup label="Welcome Message" hint="The first message visitors see when they open the chat.">
              <Textarea
                value={config.welcomeMessage || ""}
                onChange={(e) => updateConfig("welcomeMessage", e.target.value)}
                rows={2}
                className="text-sm"
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
                    <Input
                      value={s}
                      onChange={(e) => updateStarter(i, e.target.value)}
                      className="h-7 text-xs flex-1"
                      placeholder={`e.g. "What services do you offer?"`}
                    />
                    <button
                      type="button"
                      onClick={() => removeStarter(i)}
                      className="p-1 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
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
                  className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors"
                >
                  <Plus className="w-3 h-3" />
                  Add quick reply
                </button>
              )}
            </div>
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
              <Input
                value={config.launcherIcon || ""}
                onChange={(e) => updateConfig("launcherIcon", e.target.value)}
                className="h-8 text-sm"
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

            <hr className="border-border/50" />

            <FieldGroup
              label="Greeting Message"
              hint="A small popup message that appears next to the chat button to encourage visitors to start a conversation. Leave empty to disable."
            >
              <Textarea
                value={config.greetingMessage || ""}
                onChange={(e) => updateConfig("greetingMessage", e.target.value)}
                rows={2}
                className="text-sm"
                placeholder="👋 Hi there! Need any help?"
              />
            </FieldGroup>

            <FieldGroup
              label="Greeting Delay"
              hint="How many seconds after the page loads before the greeting appears."
            >
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min={0}
                  max={60}
                  value={config.greetingDelay ?? 3}
                  onChange={(e) => updateConfig("greetingDelay", parseInt(e.target.value) || 0)}
                  className="h-8 text-sm w-20"
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
              <Input
                value={clientWebsite}
                onChange={(e) => onClientWebsiteChange(e.target.value)}
                className="h-8 text-sm"
                placeholder="https://example.com"
              />
            </FieldGroup>

            <FieldGroup
              label="Allowed Websites"
              hint="Only these websites can use the widget. Leave empty to allow any website. One URL per line."
            >
              <Textarea
                value={allowedOrigins}
                onChange={(e) => onAllowedOriginsChange(e.target.value)}
                rows={3}
                className="text-sm font-mono"
                placeholder={"https://example.com\nhttps://staging.example.com"}
              />
            </FieldGroup>

            {/* Embed Code */}
            {embedCode && (
              <>
                <hr className="border-border/50" />
                <div className="space-y-1.5">
                  <Label className="text-xs">Embed Code</Label>
                  <p className="text-[11px] text-muted-foreground">
                    Copy this code and paste it before the closing <code className="text-[10px] bg-muted px-1 py-0.5 rounded">&lt;/body&gt;</code> tag on your client&apos;s website.
                  </p>
                  <div className="relative">
                    <pre className="bg-muted/50 rounded-lg p-3 text-xs font-mono text-foreground/80 overflow-x-auto whitespace-pre-wrap break-all">
                      {embedCode}
                    </pre>
                    <button
                      type="button"
                      onClick={() => navigator.clipboard.writeText(embedCode)}
                      className="absolute top-2 right-2 px-2 py-1 text-[10px] font-medium bg-background border border-border rounded-md hover:bg-muted transition-colors"
                    >
                      Copy
                    </button>
                  </div>
                </div>
              </>
            )}

            {!embedCode && (
              <div className="rounded-lg border border-dashed border-border/60 bg-muted/20 p-4">
                <p className="text-xs text-muted-foreground text-center">
                  Deploy your widget to get the embed code. Click &ldquo;Deploy Widget&rdquo; in the top bar when you&apos;re ready.
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
