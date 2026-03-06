"use client";

import { Plus, X } from "lucide-react";
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

export function ConfigPanel({
  config,
  onChange,
  clientWebsite,
  onClientWebsiteChange,
  allowedOrigins,
  onAllowedOriginsChange,
  embedCode,
}: ConfigPanelProps) {
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
    <div className="w-[400px] shrink-0 border-r border-border overflow-y-auto p-5 space-y-5">
      <h3 className="text-sm font-semibold text-foreground">Widget Settings</h3>

      {/* Theme */}
      <div className="space-y-1.5">
        <Label className="text-xs">Theme</Label>
        <div className="flex gap-2">
          {(["light", "dark"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => updateConfig("theme", t)}
              className={`flex-1 px-3 py-1.5 rounded-md text-xs font-medium border transition-all capitalize ${
                (config.theme || "light") === t
                  ? "bg-primary/10 border-primary/30 text-primary"
                  : "bg-muted/50 border-border text-muted-foreground hover:border-primary/30"
              }`}
            >
              {t === "light" ? "Light" : "Dark"}
            </button>
          ))}
        </div>
      </div>

      {/* Primary Color */}
      <div className="space-y-1.5">
        <Label className="text-xs">Primary Color</Label>
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
      </div>

      {/* Agent Name */}
      <div className="space-y-1.5">
        <Label className="text-xs">Display Name</Label>
        <Input
          value={config.agentName || ""}
          onChange={(e) => updateConfig("agentName", e.target.value)}
          className="h-8 text-sm"
          placeholder="AI Assistant"
        />
      </div>

      {/* Header Text */}
      <div className="space-y-1.5">
        <Label className="text-xs">Header Text</Label>
        <Input
          value={config.headerText || ""}
          onChange={(e) => updateConfig("headerText", e.target.value)}
          className="h-8 text-sm"
          placeholder="Same as display name"
        />
      </div>

      {/* Avatar */}
      <div className="space-y-1.5">
        <Label className="text-xs">Avatar (URL or emoji)</Label>
        <Input
          value={config.agentAvatar || ""}
          onChange={(e) => updateConfig("agentAvatar", e.target.value)}
          className="h-8 text-sm"
          placeholder="https://... or emoji"
        />
      </div>

      {/* Welcome Message */}
      <div className="space-y-1.5">
        <Label className="text-xs">Welcome Message</Label>
        <Textarea
          value={config.welcomeMessage || ""}
          onChange={(e) => updateConfig("welcomeMessage", e.target.value)}
          rows={2}
          className="text-sm"
          placeholder="Hi! How can I help you today?"
        />
      </div>

      {/* Conversation Starters */}
      <div className="space-y-2">
        <Label className="text-xs">Conversation Starters</Label>
        <div className="space-y-1.5">
          {starters.map((s, i) => (
            <div key={i} className="flex gap-1.5">
              <Input
                value={s}
                onChange={(e) => updateStarter(i, e.target.value)}
                className="h-7 text-xs flex-1"
                placeholder={`Starter ${i + 1}`}
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
            Add starter
          </button>
        )}
      </div>

      {/* Position */}
      <div className="space-y-1.5">
        <Label className="text-xs">Position</Label>
        <div className="flex gap-2">
          {(["right", "left"] as const).map((pos) => (
            <button
              key={pos}
              type="button"
              onClick={() => updateConfig("position", pos)}
              className={`flex-1 px-3 py-1.5 rounded-md text-xs font-medium border transition-all capitalize ${
                (config.position || "right") === pos
                  ? "bg-primary/10 border-primary/30 text-primary"
                  : "bg-muted/50 border-border text-muted-foreground hover:border-primary/30"
              }`}
            >
              {pos}
            </button>
          ))}
        </div>
      </div>

      {/* Corner Style */}
      <div className="space-y-1.5">
        <Label className="text-xs">Corner Style</Label>
        <div className="flex gap-2">
          {(["rounded", "sharp"] as const).map((style) => (
            <button
              key={style}
              type="button"
              onClick={() => updateConfig("borderRadius", style)}
              className={`flex-1 px-3 py-1.5 rounded-md text-xs font-medium border transition-all capitalize ${
                (config.borderRadius || "rounded") === style
                  ? "bg-primary/10 border-primary/30 text-primary"
                  : "bg-muted/50 border-border text-muted-foreground hover:border-primary/30"
              }`}
            >
              {style}
            </button>
          ))}
        </div>
      </div>

      {/* Show Branding */}
      <div className="flex items-center justify-between">
        <div>
          <Label className="text-xs">Show &ldquo;Powered by&rdquo;</Label>
          <p className="text-[11px] text-muted-foreground">
            Display LaunchPath branding in the widget footer.
          </p>
        </div>
        <button
          type="button"
          onClick={() => updateConfig("showBranding", config.showBranding === false ? true : false)}
          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
            config.showBranding !== false ? "bg-primary" : "bg-muted"
          }`}
        >
          <span
            className={`inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform ${
              config.showBranding !== false ? "translate-x-[18px]" : "translate-x-[3px]"
            }`}
          />
        </button>
      </div>

      <hr className="border-border" />

      {/* Client Website */}
      <div className="space-y-1.5">
        <Label className="text-xs">Client Website URL</Label>
        <Input
          value={clientWebsite}
          onChange={(e) => onClientWebsiteChange(e.target.value)}
          className="h-8 text-sm"
          placeholder="https://example.com"
        />
        <p className="text-[11px] text-muted-foreground">
          Preview how the widget looks on the client&apos;s website.
        </p>
      </div>

      {/* Allowed Websites */}
      <div className="space-y-1.5">
        <Label className="text-xs">Allowed Websites</Label>
        <Textarea
          value={allowedOrigins}
          onChange={(e) => onAllowedOriginsChange(e.target.value)}
          rows={2}
          className="text-sm font-mono"
          placeholder={"https://example.com\nhttps://staging.example.com"}
        />
        <p className="text-[11px] text-muted-foreground">
          Which websites can use this widget? One URL per line. Leave empty to allow all websites.
        </p>
      </div>

      {/* Embed Code */}
      {embedCode && (
        <>
          <hr className="border-border" />
          <div className="space-y-1.5">
            <Label className="text-xs">Embed Code</Label>
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
    </div>
  );
}
